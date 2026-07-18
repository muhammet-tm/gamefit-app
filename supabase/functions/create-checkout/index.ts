// Create a Stripe Checkout session for GameFit Premium.
// Prices are fixed server-side; the redirect origin is safelisted.
import Stripe from 'npm:stripe@14.21.0';
import { corsHeaders, json, getUser, resolveAllowedOrigin } from '../_shared/helpers.ts';

const PRICE_MAP: Record<string, string> = {
  monthly: 'price_1Tf1XrRF1yicfWU8rYCfkQ7n', // AED 29.99 / month
  yearly: 'price_1Tf1XrRF1yicfWU8YUtHIA7I',  // AED 214.99 / year
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { plan } = await req.json();
    const priceId = PRICE_MAP[plan];
    if (!priceId) return json({ error: 'Invalid plan' }, 400);

    const origin = resolveAllowedOrigin(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?premium=success`,
      cancel_url: `${origin}/premium`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { plan, user_id: user.id },
    });

    return json({ url: session.url, meta: { version: 1 } });
  } catch (error) {
    console.error('create-checkout error:', (error as Error).message);
    return json({ error: 'Could not start checkout. Please try again.' }, 500);
  }
});
