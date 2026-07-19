# GameFit — Launch Checklist

State as of 19 July 2026. ✅ done & verified · 🔲 needs YOUR action.

## Done and verified

- ✅ Supabase backend: server-authoritative economy (27/27 E2E tests), RLS
  lockdown, atomic purchases, Asia/Dubai streaks, badge engine
- ✅ Edge Functions live: coach-g (10/month cap server-side, prompt-injection
  hardened, under-18 conservative mode), create-checkout (AED prices
  discovered from Stripe at runtime), stripe-webhook (signature-verified,
  invoice.paid self-healing), strava-auth (token refresh), delete-account
- ✅ Full Stripe test purchase verified end-to-end (checkout → webhook → PRO)
- ✅ New avatar system (5 classes × 5 tiers), realistic faces, lively hair
- ✅ Retention layer: Bronze→Apex ranks, monthly streak calendar, real
  leaderboard, workout celebration, XP chart, reworked onboarding (16+)
- ✅ Honest UX: no fake premium modal, no fake marketplace codes, real
  account deletion
- ✅ PWA: manifest, icons, network-first service worker, installable
- ✅ SEO: full meta/OG/Twitter tags, og-image, robots.txt, sitemap.xml
- ✅ Legal drafts at /terms, /privacy, /delete-account (marked DRAFT)
- ✅ Native shells (Capacitor): android/ + ios/, icons/splashes generated,
  OAuth deep links registered, purchase UI hidden on native (store policy)
- ✅ Store screenshots in store-assets/
- ✅ Analytics/monitoring code ready (activates when keys are set)

## Your actions to go live

### 1. Stripe → live mode (~15 min)
1. dashboard.stripe.com → toggle Test mode OFF.
2. Product catalog → create the SAME two prices in live mode:
   AED 29.99/month and AED 214.99/year (the code finds them automatically).
3. Developers → API keys → copy the LIVE secret key → Supabase → Edge
   Functions → Secrets → replace `STRIPE_SECRET_KEY`.
4. Developers → Webhooks → Add endpoint (live mode):
   `https://bigqoiekozxfgiznoedm.supabase.co/functions/v1/stripe-webhook`
   with the same 4 events → copy the new `whsec_` → replace
   `STRIPE_WEBHOOK_SECRET` in Supabase secrets.
5. Settings → Billing → Customer portal → Activate (lets users cancel
   themselves — legally important).
6. Complete Stripe's business activation (bank account, ID) if not done.

### 2. Analytics accounts (~10 min, free tiers)
1. posthog.com → create project (EU cloud) → copy the Project API key →
   Vercel → Settings → Environment Variables → add `VITE_POSTHOG_KEY`.
2. sentry.io → create React project → copy the DSN → add `VITE_SENTRY_DSN`
   in Vercel. Redeploy (Deployments → ⋯ → Redeploy) to bake them in.

### 3. Domain cutover: gamefit.online → Vercel (~10 min + DNS wait)
1. Vercel → gamefit-app → Settings → Domains → Add `gamefit.online` and
   `www.gamefit.online`. Vercel shows you the required records.
2. At your DNS provider: set A record `@` → `76.76.21.21` and CNAME `www` →
   `cname.vercel-dns.com` (use exactly what Vercel displays).
3. Wait for it to verify (minutes to a few hours). The old Base44 app stays
   reachable in their dashboard as a fallback; archive it after a week.
4. Supabase → Authentication → URL Configuration: set Site URL to
   `https://gamefit.online`, add it to Redirect URLs (keep the vercel.app
   one too), and add `online.gamefit.app://auth-callback` for the mobile apps.
5. Update Google OAuth authorized origins to include gamefit.online.

### 4. Legal review
The /terms and /privacy pages are solid drafts, but have a lawyer review
them before charging real customers (they are marked DRAFT in-app until
you remove the banner in src/pages/legal/LegalLayout.jsx).

### 5. Auth email branding (~10 min)
Supabase → Authentication → Email Templates: paste the GameFit header (logo
URL https://gamefit.online/icons/icon-192.png), adjust wording. Also set
SMTP (Resend free tier) under Project Settings → Auth → SMTP when you want
emails from @gamefit.online instead of Supabase's shared sender.

### 6. App stores
Follow docs/STORE_SUBMISSION.md (accounts, builds, listing answers).

## Known limitations / deferred (honest list)

- Engagement emails (daily reminder, weekly summary) are not yet scheduled —
  needs a Resend key + pg_cron wiring (ask Claude when ready).
- Marketplace partner rewards are an honest "coming soon" preview.
- Friends leaderboard is a teased future feature.
- Avatar shoulder seam slightly visible at very large sizes (polish item).
- Onboarding/timer animations unverifiable in the CI browser (rAF-frozen
  tab) — verified logic-level + on real devices during your phone pass.
- QA test account (qa@gamefit.online) holds test data — delete it from
  Supabase → Authentication before public launch, along with the orphaned
  `gamefit.e2e.*@gmail.com` signups.
