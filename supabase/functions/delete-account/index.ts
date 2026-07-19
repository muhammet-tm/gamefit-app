// Permanently delete the calling user's account and all their data.
// Required by Apple (5.1.1(v)) and Google Play's account-deletion policy,
// and by GDPR/UAE PDPL erasure rights.
//
// The profiles row and all child rows (workouts, meal_logs, ai_request_logs,
// coin_transactions, strava_connections) cascade from auth.users. An active
// Stripe subscription is cancelled first so nobody keeps getting charged.
import Stripe from 'npm:stripe@14.21.0';
import { corsHeaders, json, getUser, getProfile, serviceClient } from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { confirm } = await req.json().catch(() => ({}));
    if (confirm !== 'DELETE') {
      return json({ error: 'Confirmation required' }, 400);
    }

    const profile = await getProfile(user.id);

    // cancel any active subscription so billing stops immediately
    if (profile?.stripe_subscription_id) {
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
        console.log(`Cancelled subscription for ${user.id}`);
      } catch (e) {
        // already cancelled / test data — deletion proceeds regardless
        console.warn('Subscription cancel failed:', (e as Error).message);
      }
    }

    // remove meal photos from storage (best effort)
    try {
      const storage = serviceClient().storage.from('meal-photos');
      const { data: files } = await storage.list(user.id, { limit: 100 });
      if (files?.length) {
        await storage.remove(files.map((f) => `${user.id}/${f.name}`));
      }
    } catch (e) {
      console.warn('Photo cleanup failed:', (e as Error).message);
    }

    // delete the auth user — everything else cascades
    const { error } = await serviceClient().auth.admin.deleteUser(user.id);
    if (error) {
      console.error('deleteUser failed:', error.message);
      return json({ error: 'Could not delete the account. Please contact support.' }, 500);
    }

    console.log(`Account deleted: ${user.id}`);
    return json({ deleted: true });
  } catch (error) {
    console.error('delete-account error:', (error as Error).message);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
