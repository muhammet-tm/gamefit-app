// Strava OAuth + activity fetch.
// Improvements over the old version: tokens live in the service-only
// strava_connections table (invisible to all clients), automatic token
// refresh when expired, and the client never sends or receives raw tokens.
import {
  corsHeaders, json, getUser, serviceClient, resolveAllowedOrigin,
} from '../_shared/helpers.ts';

const CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET') ?? '';

async function refreshIfNeeded(userId: string, conn: {
  access_token: string; refresh_token: string; expires_at: number;
}): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (conn.expires_at - 300 > now) return conn.access_token; // still valid

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token,
    }),
  });
  if (!res.ok) {
    console.error('Strava token refresh failed:', await res.text());
    return null;
  }
  const t = await res.json();
  await serviceClient().from('strava_connections').update({
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: t.expires_at,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  return t.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    // ---- authorize: build the Strava consent URL for our origin
    if (action === 'authorize') {
      const origin = resolveAllowedOrigin(req, '');
      if (!origin) return json({ error: 'Untrusted origin' }, 403);
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: `${origin}/strava/callback`,
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'read,activity:read_all',
      });
      return json({ url: `https://www.strava.com/oauth/authorize?${params}` });
    }

    // everything below requires a logged-in user
    const user = await getUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const db = serviceClient();

    // ---- exchange: code -> tokens, stored server-side only
    if (action === 'exchange') {
      const { code } = body;
      if (!code) return json({ error: 'code required' }, 400);

      const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
        }),
      });
      if (!tokenRes.ok) {
        console.error('Strava token exchange error:', await tokenRes.text());
        return json({ error: 'Token exchange failed' }, 502);
      }

      const tokenData = await tokenRes.json();
      const athlete = tokenData.athlete ?? {};
      const publicAthlete = {
        id: athlete.id,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
      };

      await db.from('strava_connections').upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        athlete: publicAthlete,
        updated_at: new Date().toISOString(),
      });

      // reflect the connection on the profile (public info only)
      const { data: profile } = await db
        .from('profiles').select('connected_apps').eq('id', user.id).single();
      const apps = new Set([...(profile?.connected_apps ?? []), 'strava']);
      await db.from('profiles').update({ connected_apps: [...apps] }).eq('id', user.id);

      return json({ connected: true, athlete: publicAthlete });
    }

    // ---- activities: fetch with the stored token, refreshing if expired
    if (action === 'activities') {
      const { data: conn } = await db
        .from('strava_connections').select('*').eq('user_id', user.id).single();
      if (!conn) return json({ error: 'Strava not connected' }, 400);

      const token = await refreshIfNeeded(user.id, conn);
      if (!token) return json({ error: 'Strava connection expired — please reconnect.' }, 401);

      const activitiesRes = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=10',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!activitiesRes.ok) {
        console.error('Strava activities error:', await activitiesRes.text());
        return json({ error: 'Failed to fetch activities' }, 502);
      }
      return json({ activities: await activitiesRes.json() });
    }

    // ---- disconnect: forget the connection
    if (action === 'disconnect') {
      await db.from('strava_connections').delete().eq('user_id', user.id);
      const { data: profile } = await db
        .from('profiles').select('connected_apps').eq('id', user.id).single();
      const apps = (profile?.connected_apps ?? []).filter((a: string) => a !== 'strava');
      await db.from('profiles').update({ connected_apps: apps }).eq('id', user.id);
      return json({ disconnected: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('strava-auth error:', (error as Error).message);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
