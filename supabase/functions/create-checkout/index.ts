// Create a Stripe Checkout session for GameFit Premium.
// Prices are discovered from Stripe (active recurring prices, AED preferred)
// so rotating prices in the dashboard never requires a code change.
// The redirect origin is safelisted.
import Stripe from 'npm:stripe@14.21.0';
import { corsHeaders, json, getUser, resolveAllowedOrigin } from '../_shared/helpers.ts';

const PLAN_INTERVAL: Record<string, 'month' | 'year'> = {
  monthly: 'month',
  yearly: 'year',
};

// cache the lookup for the lifetime of a warm function instance
let priceCache: { at: number; byInterval: Record<string, string> } | null = null;
const PRICE_TTL_MS = 5 * 60 * 1000;

async function resolvePriceId(stripe: Stripe, interval: 'month' | 'year'): Promise<string | null> {
  if (!priceCache || Date.now() - priceCache.at > PRICE_TTL_MS) {
    const prices = await stripe.prices.list({ active: true, type: 'recurring', limit: 100 });
    const byInterval: Record<string, string> = {};
    for (const p of prices.data) {
      const iv = p.recurring?.interval;
      if (!iv) continue;
      // prefer AED prices; fall back to whatever exists
      if (!byInterval[iv] || p.currency === 'aed') {
        if (p.currency === 'aed' || !byInterval[iv]) byInterval[iv] = p.id;
      }
    }
    priceCache = { at: Date.now(), byInterval };
  }
  return priceCache.byInterval[interval] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { plan } = await req.json();
    const interval = PLAN_INTERVAL[plan];
    if (!interval) return json({ error: 'Invalid plan' }, 400);

    const origin = resolveAllowedOrigin(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

    const priceId = await resolvePriceId(stripe, interval);
    if (!priceId) {
      console.error(`No active ${interval}ly price found in Stripe`);
      return json({ error: 'Subscriptions are being set up — please try again soon.' }, 503);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?premium=success`,
      cancel_url: `${origin}/premium`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { plan, user_id: user.id },
    });

    return json({ url: session.url, meta: { version: 2 } });
  } catch (error) {
    console.error('create-checkout error:', (error as Error).message);
    return json({ error: 'Could not start checkout. Please try again.' }, 500);
  }
});
