// Shared helpers for GameFit Edge Functions.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Origins allowed to call these functions from a browser.
 *
 * Includes the Capacitor shells: iOS WebViews send `capacitor://localhost`
 * and Android sends `https://localhost`. Leaving those out would break the
 * native apps while leaving the web app working, which is the kind of thing
 * nobody notices until a store review fails.
 */
export function isAllowedOrigin(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol === 'capacitor:' && u.hostname === 'localhost') return true;
    const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (isLocal && (u.protocol === 'http:' || u.protocol === 'https:')) return true;
    const isProd = u.hostname === 'gamefit.online' || u.hostname === 'www.gamefit.online';
    const isVercel =
      u.hostname === 'gamefit-app.vercel.app' ||
      (u.hostname.startsWith('gamefit-app-') && u.hostname.endsWith('.vercel.app'));
    return (isProd || isVercel) && u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

const CORS_BASE = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  // Responses differ by Origin, so any cache in front of this must key on it.
  'Vary': 'Origin',
};

/** CORS headers for one request. Echoes the origin only if it is on the list. */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  if (origin && isAllowedOrigin(origin)) {
    return { ...CORS_BASE, 'Access-Control-Allow-Origin': origin };
  }
  // No header at all. A browser then refuses to hand the response to the
  // calling page. Non-browser callers (curl, server-to-server) are unaffected,
  // because CORS is enforced by the browser and by nothing else.
  return { ...CORS_BASE };
}

/**
 * Wraps a handler with origin-checked CORS.
 *
 * The previous version exported a fixed `Access-Control-Allow-Origin: *`,
 * which let any website on the internet call these endpoints from a visitor's
 * browser. Doing it as a wrapper rather than threading the request through
 * `json()` keeps the ~30 existing `json(...)` call sites untouched.
 */
export function withCors(
  handler: (req: Request) => Response | Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const cors = corsHeadersFor(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: cors });
    }
    const res = await handler(req);
    const headers = new Headers(res.headers);
    headers.delete('Access-Control-Allow-Origin');
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Client that acts AS the calling user (RLS applies). */
export function userClient(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  );
}

/** Privileged client (bypasses RLS). Use only for server-owned writes/reads. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** Resolve the authenticated user or null. */
export async function getUser(req: Request) {
  const { data, error } = await userClient(req).auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/** Fetch the caller's profile row via service role. */
export async function getProfile(userId: string) {
  const { data, error } = await serviceClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

/**
 * Origins allowed to receive redirects (checkout success/cancel, OAuth).
 * Locked to our own deployments — prevents open-redirect abuse.
 */
export function resolveAllowedOrigin(req: Request, fallback = 'https://gamefit.online'): string {
  const raw = req.headers.get('origin') ?? '';
  // Shares one allowlist with the CORS layer, so the two can never disagree
  // about which origins are ours.
  if (isAllowedOrigin(raw)) {
    try {
      return new URL(raw).origin;
    } catch (_) { /* fall through */ }
  }
  return fallback;
}

/** Strip a user-supplied string down to prompt-safe characters. */
export function sanitizeForPrompt(value: unknown, maxLen = 200): string {
  return String(value ?? '')
    .replace(/[^\w\s,.'()/-]/g, '')
    .slice(0, maxLen)
    .trim();
}

/** Verify premium server-side against Stripe — never trust account_type. */
export async function verifyPremium(
  profile: { stripe_subscription_id?: string | null; stripe_customer_id?: string | null },
  stripe: { subscriptions: { retrieve: (id: string) => Promise<{ status: string; customer: unknown }> } },
): Promise<boolean> {
  if (!profile?.stripe_subscription_id) return false;
  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    return (
      (sub.status === 'active' || sub.status === 'trialing') &&
      sub.customer === profile.stripe_customer_id
    );
  } catch (_) {
    return false;
  }
}
