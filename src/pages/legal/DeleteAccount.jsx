import React from 'react';
import LegalLayout, { H, P, LI } from './LegalLayout';

// Public web resource for account deletion — required by Google Play's
// account-deletion policy (linked from the Data Safety form) and useful for
// anyone who can no longer access the app.
export default function DeleteAccount() {
  return (
    <LegalLayout title="Delete Your Account" updated="19 July 2026">
      <P>
        Deleting your GameFit account permanently erases your profile, workouts, meals,
        AI-coaching history, photos, XP, coins, badges and purchased avatar items, and cancels
        any active Premium subscription. This cannot be undone.
      </P>

      <H>Delete inside the app (fastest)</H>
      <ul className="space-y-1.5">
        <LI>Open GameFit and sign in.</LI>
        <LI>Go to the <strong>Profile</strong> tab.</LI>
        <LI>Scroll down and tap <strong>Delete Account</strong>.</LI>
        <LI>Confirm with <strong>Delete Forever</strong>. Your data is removed immediately.</LI>
      </ul>

      <H>Can't access the app?</H>
      <P>
        Email <strong>support@gamefit.online</strong> from the address your account is
        registered with, with the subject "Delete my account". We verify the request and
        complete the deletion within 30 days, confirming by reply.
      </P>

      <H>What is retained</H>
      <P>
        Nothing from your GameFit profile. Stripe retains payment records it is legally
        required to keep as a payment processor.
      </P>
    </LegalLayout>
  );
}
