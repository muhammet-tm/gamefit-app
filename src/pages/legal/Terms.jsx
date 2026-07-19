import React from 'react';
import LegalLayout, { H, P, LI } from './LegalLayout';

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="19 July 2026">
      <P>
        These terms govern your use of GameFit (the app at gamefit.online and its mobile
        applications). By creating an account you agree to them.
      </P>

      <H>1. The service</H>
      <P>
        GameFit turns your self-reported workouts into a game: you earn XP, coins, streaks,
        badges and avatar upgrades, optionally guided by an AI coach. Free accounts include
        core tracking and 10 AI coaching requests per month. GameFit Premium adds unlimited AI
        coaching and additional features.
      </P>

      <H>2. Eligibility</H>
      <P>
        You must be at least 16 years old. If you are under 18, you confirm a parent or
        guardian permits your use. One account per person; you are responsible for keeping
        your login secure.
      </P>

      <H>3. Not medical advice</H>
      <P>
        GameFit and Coach G provide general fitness and nutrition information for healthy
        adults. They are not medical, dietetic or physiotherapy services, and no content in
        the app is a diagnosis, treatment or prescription. Consult a qualified professional
        before starting an exercise program, especially if you have any medical condition,
        injury, or are pregnant. Stop exercising and seek help if you feel unwell. You use
        the app at your own risk.
      </P>

      <H>4. Subscriptions and payments</H>
      <ul className="space-y-1.5">
        <LI>GameFit Premium costs AED 29.99/month or AED 214.99/year, billed through Stripe on the web app.</LI>
        <LI>Subscriptions renew automatically until cancelled. You can cancel anytime; access continues until the end of the paid period. No partial refunds, except where required by law.</LI>
        <LI>Prices may change with at least 30 days' notice before your next renewal.</LI>
      </ul>

      <H>5. Virtual items</H>
      <P>
        XP, coins, badges and avatar items are virtual features with no monetary value. They
        cannot be sold, transferred or exchanged for money, and are lost when an account is
        deleted. We may rebalance game rules to keep play fair.
      </P>

      <H>6. Fair play</H>
      <P>
        Don't attempt to falsify activity, exploit bugs, abuse the AI coach, attack the
        service, or harass others on leaderboards. We may correct fraudulent progress and
        suspend or close accounts that break these rules.
      </P>

      <H>7. Your content</H>
      <P>
        You own what you submit (notes, photos). You grant us the limited licence needed to
        operate the service — e.g. sending a meal photo to our AI provider to analyse it for
        you. We don't use your content for advertising.
      </P>

      <H>8. Termination</H>
      <P>
        You may delete your account at any time in the app (Profile → Delete Account). We may
        suspend or terminate accounts that violate these terms or where required by law.
      </P>

      <H>9. Disclaimers and liability</H>
      <P>
        The service is provided "as is". To the maximum extent permitted by law, we are not
        liable for injuries arising from your training decisions, for indirect or
        consequential losses, or for amounts exceeding what you paid us in the 12 months
        before a claim. Nothing here limits liability that cannot be limited by law.
      </P>

      <H>10. Governing law</H>
      <P>
        These terms are governed by the laws of the United Arab Emirates. Disputes are subject
        to the exclusive jurisdiction of the courts of Abu Dhabi.
      </P>

      <H>11. Contact</H>
      <P>GameFit · Abu Dhabi, UAE · support@gamefit.online</P>
    </LegalLayout>
  );
}
