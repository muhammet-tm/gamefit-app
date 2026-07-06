// Stripe webhook — the ONLY writer of premium status in the database.
// Signature-verified; deployed with verify_jwt = false (Stripe cannot send a
// Supabase JWT). Handles: checkout.session.completed, invoice.paid,
// invoice.payment_failed, customer.subscription.deleted.
import Stripe from 'npm:stripe@14.21.0';
import { json, serviceClient } from '../_shared/helpers.ts';

async function sendEmail(to: string, subject: string, text: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key || !to) return; // email is optional until Resend is configured
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GameFit <notifications@gamefit.online>',
        to: [to],
        subject,
        text,
      }),
    });
  } catch (e) {
    console.error('email send failed:', (e as Error).message);
  }
}

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const db = serviceClient();
  console.log(`Stripe event: ${event.type}`);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // Bind by the client_reference_id we set at checkout — never by the
      // payer-entered billing email.
      const userId = session.client_reference_id || session.metadata?.user_id;
      if (!userId) {
        console.warn('No client_reference_id — cannot bind checkout to a user');
        return json({ received: true });
      }

      const { data: profile } = await db
        .from('profiles').select('id, email, full_name').eq('id', userId).single();
      if (!profile) {
        console.warn(`No profile for id ${userId}`);
        return json({ received: true });
      }

      await db.from('profiles').update({
        account_type: 'premium',
        premium_since: new Date().toISOString(),
        stripe_customer_id: String(session.customer),
        stripe_subscription_id: String(session.subscription),
      }).eq('id', userId);

      console.log(`Premium activated for ${userId}`);
      await sendEmail(
        profile.email,
        '⚡ Welcome to GameFit Premium!',
        `Hey ${profile.full_name || 'Champion'}! 🎉

Your GameFit Premium subscription is now active!

You now have access to:
👑 Unlimited AI coaching with Coach G
🥗 AI-powered nutrition tracking & meal snap
📊 Advanced analytics

Open the app and explore your new powers!

— The GameFit Team`,
      );
    }

    if (event.type === 'invoice.paid') {
      // Renewal succeeded — make sure premium stays on (self-heals a missed
      // checkout event too).
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer);
      const { data: profile } = await db
        .from('profiles').select('id, account_type').eq('stripe_customer_id', customerId).single();
      if (profile && profile.account_type !== 'premium') {
        await db.from('profiles').update({
          account_type: 'premium',
          premium_since: new Date().toISOString(),
        }).eq('id', profile.id);
        console.log(`Premium re-activated on invoice.paid for ${profile.id}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer);
      const { data: profile } = await db
        .from('profiles').select('id').eq('stripe_customer_id', customerId).single();
      if (profile) {
        await db.from('profiles').update({
          account_type: 'regular',
          stripe_subscription_id: null,
        }).eq('id', profile.id);
        console.log(`Premium cancelled for ${profile.id}`);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer);
      const { data: profile } = await db
        .from('profiles').select('email').eq('stripe_customer_id', customerId).single();
      const to = profile?.email || invoice.customer_email;
      if (to) {
        await sendEmail(
          to,
          '⚠️ GameFit Premium — Payment Failed',
          `Hey! Unfortunately your GameFit Premium payment failed.

Please update your payment method to keep your premium access.

Open the app to manage your subscription.

— The GameFit Team`,
        );
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', (err as Error).message);
    return json({ error: 'handler error' }, 500);
  }

  return json({ received: true });
});
