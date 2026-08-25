// Permanently delete the calling user's account and all their data.
// Required by Apple (5.1.1(v)) and Google Play's account-deletion policy,
// and by GDPR/UAE PDPL erasure rights.
//
// The profiles row and all child rows (workouts, meal_logs, ai_request_logs,
// coin_transactions, strava_connections) cascade from auth.users. An active
// Stripe subscription is cancelled first so nobody keeps getting charged.
import Stripe from 'npm:stripe@14.21.0';
import { withCors, json, getUser, getProfile, serviceClient } from '../_shared/helpers.ts';

Deno.serve(withCors(async (req) => {

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

    // Remove meal photos from storage.
    //
    // Storage objects do NOT cascade from auth.users — only the Postgres rows
    // do — so anything missed here survives the account forever as orphaned
    // personal data, which is exactly what an erasure request forbids.
    //
    // This used to be a single list({ limit: 100 }). 100 is the API's default
    // page size, not a total, so a user with more photos than that kept the
    // remainder. A premium account can analyse up to 30 meals a day, so the
    // threshold is reachable in under a week of normal use.
    //
    // Deletion is still best effort: if storage is unavailable we proceed, on
    // the grounds that half-erasing is better than refusing to erase. Anything
    // left behind is logged loudly rather than swallowed.
    try {
      const storage = serviceClient().storage.from('meal-photos');
      const PAGE = 100;
      let offset = 0;
      let removed = 0;
      for (;;) {
        const { data: files, error: listError } = await storage.list(user.id, {
          limit: PAGE,
          offset,
        });
        if (listError) throw listError;
        if (!files?.length) break;
        const { error: removeError } = await storage.remove(
          files.map((f) => `${user.id}/${f.name}`),
        );
        if (removeError) throw removeError;
        removed += files.length;
        // A full page means there may be more. Removing the page shifts the
        // window, so the offset deliberately stays at 0 rather than advancing.
        if (files.length < PAGE) break;
        offset = 0;
        // Guard against a pathological loop if a remove silently no-ops.
        if (removed > 10_000) {
          console.warn(`Photo cleanup stopped at ${removed} files for ${user.id}`);
          break;
        }
      }
      console.log(`Removed ${removed} meal photo(s) for ${user.id}`);
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
}));
