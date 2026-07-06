// Shared helpers for GameFit Edge Functions.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
  try {
    const u = new URL(raw);
    const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    const isProd =
      u.hostname === 'gamefit.online' || u.hostname === 'www.gamefit.online';
    const isVercel =
      u.hostname === 'gamefit-app.vercel.app' ||
      (u.hostname.startsWith('gamefit-app-') && u.hostname.endsWith('.vercel.app'));
    if ((isLocal && u.protocol === 'http:') || ((isProd || isVercel) && u.protocol === 'https:')) {
      return u.origin;
    }
  } catch (_) { /* fall through */ }
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
