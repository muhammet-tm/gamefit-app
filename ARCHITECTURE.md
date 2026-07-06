# GameFit — Architecture

> Plain-English map of the codebase for future work sessions. Updated as the
> Supabase migration progresses. Status legend: ✅ done · 🔄 in progress · ⬜ planned.

## What this app is

GameFit is a mobile-first web app that turns workouts into an RPG: you log a
workout, earn XP and coins, keep a daily streak, level up through ranks
(Bronze → Silver → Gold → Platinum → Apex), evolve an avatar, chat with an AI
coach ("Coach G"), and spend coins in an accessory shop. Premium
(Stripe subscription, AED 29.99/mo or 214.99/yr) unlocks unlimited AI
coaching, advanced plans, and nutrition extras.

## Stack (target)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vite + React 18, Tailwind, Radix/shadcn, framer-motion | ✅ imported from the old repo |
| Database + Auth | Supabase (Postgres + RLS, email/Google OAuth) | ⬜ Phase 1 |
| Server logic | Postgres RPCs (economy) + Supabase Edge Functions (Deno) | ⬜ Phase 1 |
| Payments | Stripe subscriptions + signature-verified webhook | ⬜ ported in Phase 1 |
| AI coach | Anthropic Claude Haiku, called only from Edge Function | ⬜ ported in Phase 1 |
| Email | Resend (free tier) via Edge Function | ⬜ Phase 1 |
| Hosting | Vercel (frontend), Supabase (everything else) | ⬜ Checkpoint A |
| Analytics | PostHog + Sentry (free tiers) | ⬜ Phase 5 |

## History / why this repo exists

The original app was built on the Base44 no-code platform
(repo `muhammet-tm/gamefit-dev`, live at gamefit.online). We migrated off it
because the game economy had to be rebuilt server-side anyway, and Base44's
platform limits (no DB transactions, deploy only via manual Publish, no local
backend testing) made that work weaker and slower. The old app stays live
until this one passes QA; the final step is pointing gamefit.online's DNS at
Vercel.

**Security audit of the old app** (fixed by design in this rebuild):
- Any logged-in user could read every other user's profile, including Strava tokens.
- XP/coins/streaks/badges were computed in the browser and trusted by the DB —
  anyone with dev tools could self-grant progress and shop items.
- Coins were re-derived from workout history on every page load, so shop
  purchases refunded themselves on refresh.
- Streak logic double-counted same-day workouts and had no timezone strategy.
- The upsell modals faked a premium upgrade instead of opening real checkout.
- Good news: no secret was ever committed to git in the old repo; nothing to rotate.

## Frontend map (`src/`)

- `main.jsx` / `App.jsx` — bootstrap + routes. 5-tab bottom nav (`components/gamefit/BottomNav.jsx`): Home, Train, Coach, Avatar, Profile.
- `pages/` — one file per screen. Auth: Splash, Login, Register, ForgotPassword, ResetPassword. Core: Dashboard, Train, Coach, AvatarScreen, Profile. Secondary: Leaderboard, Marketplace, Premium, Onboarding, MonthlySummary, AvatarCoach, Admin, StravaCallback.
- `lib/GameFitContext.jsx` — the app's central state (user, workouts, theme, level-up events). All economy actions funnel through here. 🔄 being rewritten: the browser now only *reports* what workout happened; the server computes XP/coins/streaks and the context reconciles its optimistic UI with the server's answer.
- `lib/mockData.js` — game constants (XP formula, level thresholds, rank names) and the mock leaderboard (⬜ dies in Phase 4 when the real leaderboard lands).
- `lib/badges.js` — the 14 badge definitions.
- `api/` — the only place that talks to the backend. 🔄 `base44Client.js` (old SDK) is being replaced by `supabase.js`.
- `components/gamefit/` — app-specific components (StreakWidget, AccessoryShop, LevelUpOverlay, NutritionTab, ...). `components/ui/` — stock shadcn primitives.
- `index.css` — design system ("Dark RPG Athletic"): CSS variables `--gf-*` for both dark and light themes; charcoal `#0D0F14`, acid green `#C8FF00`, amber, blue, purple; Barlow Condensed headings, DM Sans body.

## Backend design (Phase 1)

Tables: `profiles` (user fields + server-owned economy counters), `workouts`,
`meal_logs`, `ai_request_logs`, `coin_transactions` (append-only ledger).
A trigger creates the profile row on signup.

Row-level security: users read/update only their own rows; economy, premium,
and Strava columns are not client-writable at all. `workouts`,
`coin_transactions`, and `ai_request_logs` accept **no** client writes.

Server-authoritative economy (atomic Postgres functions):
- `log_workout(type, minutes, intensity, notes)` — validates input (1–600 min,
  max 10 workouts / 600 min per day), computes XP/coins/streak using
  **Asia/Dubai** day boundaries, applies level-up bonuses, awards badges,
  writes everything in one transaction, returns the results for the UI.
- `purchase_accessory(action, id)` — server-side prices, atomic balance check,
  ledger entry. Double-spend impossible.
- `get_leaderboard(scope)` — weekly/all-time; exposes only display name,
  level/rank, XP, and avatar look — never raw profiles.

Edge Functions (Deno, ported from the old Base44 functions):
`coach-g`, `create-checkout`, `stripe-webhook`, `strava-auth`, `engagement-emails`.

## Game constants (single source of truth once Phase 1 lands: SQL + `src/lib/game.js` preview copy)

- XP = 2 × minutes × intensity (Low 1.0 / Medium 1.5 / High 2.0)
- Coins = floor(XP / 10); streak bonus ×1.25 at 3 days, ×1.5 at 7 days
- Level-up bonus = new level × 50 coins
- Level thresholds: 0, 500, 1500, 3000, 5500, 8000, 12000, 18000, 26000, 35000
- Ranks: L1-2 Bronze II→I · L3-4 Silver II→I · L5-6 Gold II→I · L7-9 Platinum III→II→I · L10 Apex
- Avatar tiers: 1:[L1-2] 2:[L3-4] 3:[L5-6] 4:[L7-9] 5:[L10]

## Environment variables

Frontend (`.env.local`, never committed — see `.env.example`):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (both safe to expose in the browser).

Server secrets (set ONLY in the Supabase dashboard, never in this repo):
`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `RESEND_API_KEY`.

## Deploy story

Push to GitHub → Vercel builds the frontend automatically (preview URL per PR,
production on main). Database changes ship as SQL migration files in
`supabase/migrations/` applied with `npx supabase db push`; Edge Functions
deploy with `npx supabase functions deploy`.
