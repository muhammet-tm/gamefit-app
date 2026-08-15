# GameFit — Full Project Reference

> A comprehensive, single-file description of the app: what it is, how it's
> built, every screen, the full data model, and current status. For session
> handoff and "what happened last" context, see [`CLAUDE.md`](../CLAUDE.md)
> instead — that file tracks state and changes over time; this one describes
> the product as it stands.

---

## 1. What GameFit is

GameFit is a mobile-first fitness app that reframes working out as an RPG.
A user logs a workout, the server computes what it was worth, and they get
XP, coins, and a streak day back. Enough of that and they climb a five-tier
rank ladder, their layered SVG avatar gains gear, and an AI coach ("Coach G")
gives advice shaped by their actual training history. A premium subscription
unlocks unlimited AI coaching.

- **Live app:** https://gamefit-app.vercel.app
- **Future production domain:** gamefit.online (not yet cut over — see §9)
- **Repo:** https://github.com/muhammet-tm/gamefit-app

### Origin

GameFit was originally built on Base44 (a no-code platform) and is still live
there at `gamefit.online`, unrelated repo `muhammet-tm/gamefit-dev`. That
version computed XP, coins, streaks, and badges **in the browser** and wrote
the results straight to the database — any user with devtools open could
grant themselves levels, and RLS-equivalent protection didn't exist (any
logged-in user could read every other user's profile, including third-party
OAuth tokens). This repository is a from-scratch rewrite onto Supabase +
Vercel, built specifically to close that hole: every reward decision now
happens inside a `SECURITY DEFINER` Postgres function, and the columns those
functions write to are revoked from direct client access. The old app stays
live until this one is judged ready for the domain cutover.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React 18 | `base44-app` package name is a holdover from the Base44 era, harmless |
| UI | Tailwind CSS, Radix primitives via shadcn, framer-motion, recharts, canvas-confetti | Dark-first design system, CSS custom properties (`--gf-*`) |
| Markdown rendering | react-markdown + remark-gfm | Renders Coach G's answers with real tables/bold instead of literal `**` |
| Hosting | Vercel | Auto-deploys `main`; SPA rewrite in `vercel.json` so client routes don't 404 on direct load |
| Database | Supabase Postgres | Row-Level Security + column-level `GRANT`/`REVOKE` |
| Auth | Supabase Auth | Email/password + Google OAuth (system browser + deep link on native) |
| Server logic | Postgres RPCs (`SECURITY DEFINER`) + Supabase Edge Functions (Deno) | Economy logic lives in Postgres; external API calls live in Edge Functions |
| Payments | Stripe | Subscriptions in AED, prices discovered live via the Stripe API (no hardcoded price IDs) |
| AI | Anthropic Claude Haiku | Called only from the `coach-g` Edge Function; the API key never reaches the browser |
| Analytics | PostHog + Sentry | Both are inert no-ops until `VITE_POSTHOG_KEY` / `VITE_SENTRY_DSN` are set |
| Native shells | Capacitor 7 | `android/` and `ios/` folders, app id `online.gamefit.app` |
| Package manager | npm | 75 direct dependencies at last count |

Full dependency list: `package.json`.

---

## 3. Architecture

```
Browser (Vite/React PWA)  ─┬─→ Supabase Auth (session)
  or Capacitor native shell │
                             ├─→ Supabase Postgres via PostgREST (RPC calls, direct table reads for user's own rows)
                             ├─→ Supabase Storage (meal photos, private bucket)
                             └─→ Supabase Edge Functions (Deno)
                                    ├─→ coach-g          → Anthropic API
                                    ├─→ create-checkout  → Stripe API
                                    ├─→ stripe-webhook   ← Stripe (signature-verified)
                                    ├─→ strava-auth      → Strava OAuth
                                    └─→ delete-account   → Stripe + Supabase Admin API
```

Vercel serves the static build and proxies nothing — the browser talks
directly to Supabase's REST/RPC endpoints and Edge Functions using the
project's public anon key, which is safe to expose because RLS and column
grants (not the key) are what enforce access control.

---

## 4. The economy: how it stays honest

This is the architectural decision the rest of the backend follows from.

**The rule:** the client can never write a value that affects XP, coins,
streaks, badges, premium status, or role. Every one of those is written only
by a `SECURITY DEFINER` Postgres function running with elevated privilege,
which the client calls but cannot bypass.

**How it's enforced**, concretely, in `supabase/migrations/20260706120002_security.sql`:

```sql
revoke update on public.profiles from authenticated;
grant update (
  first_name, last_name, fitness_goal, fitness_level, age, height_cm,
  weight_kg, bmi, gender, avatar_config, connected_apps,
  onboarding_complete, theme_preference, calorie_goal
) on public.profiles to authenticated;
```

(`weekly_goal` was granted in a later migration, `20260718150001_weekly_goal.sql`.)

Everything not in that list — `total_xp`, `current_level`, `total_coins_earned`,
`total_coins_spent`, `current_streak`, `best_streak`, `badges`,
`owned_accessories`, `equipped_accessory`, `account_type`, `stripe_customer_id`,
`stripe_subscription_id`, `role` — cannot be written by any authenticated
client request, full stop. `workouts`, `ai_request_logs`, and
`coin_transactions` similarly have all client INSERT/UPDATE/DELETE revoked;
rows are created exclusively inside RPCs. `strava_connections` has no
policies and no grants at all, so PostgREST cannot reach it with any user
key — only Edge Functions using the service-role key can touch OAuth tokens.

**The economy RPCs** (`supabase/migrations/20260706120003_functions.sql`):

- `log_workout(exercise_type, duration_min, intensity, notes)` — validates
  input, enforces a daily cap (10 workouts / 600 minutes per day), computes
  XP and coins from duration × intensity, updates the streak (Asia/Dubai day
  boundary), evaluates badge conditions, and returns the new authoritative
  totals plus any level-up event.
- `purchase_accessory(action, accessory_id)` — atomically checks price
  against current coin balance for `purchase`, or toggles `equip`/`unequip`.
  Double-spends are impossible because the check-and-debit happens in one
  transaction.
- `get_leaderboard(scope)` — returns ranked players for `all_time` or
  `this_week`, exposing only display name, level, avatar, and XP — never
  email or body-metric fields.
- `get_workout_stats()` / `get_monthly_stats(month, year)` — read-only
  aggregation for the dashboard and monthly summary screens.
- `log_pr(exercise, weight_kg, reps, achieved_on)` — personal records (see
  §6). Deliberately awards **no XP or coins**, only cosmetic badges, because
  a self-reported lift number is unverifiable and must never feed the
  competitive economy.

**Verification approach:** rather than unit tests against mocked functions,
correctness is checked by calling the *live* REST and RPC endpoints with a
real user session — asserting exact XP/coin arithmetic on the happy path,
and a 401/403/42501 on every attempt to write a protected column directly.

---

## 5. Database schema

Tables, from `supabase/migrations/`:

| Table | Purpose | Client access |
|---|---|---|
| `profiles` | One row per auth user. User-editable fields (name, age, height, weight, goals, avatar config) plus server-owned economy/premium/role fields | Read own row; write only the granted columns |
| `workouts` | Logged workout history with the XP/coins/level snapshot at time of logging | Read own rows; no direct writes |
| `meal_logs` | Nutrition entries, optionally with a photo and AI-scored health rating | Full CRUD on own rows |
| `ai_request_logs` | One row per Coach G request, used to enforce the 10/month free cap | Read own rows; no direct writes |
| `coin_transactions` | Append-only ledger for non-workout coin movements (purchases, adjustments) | Read own rows; no direct writes |
| `accessories` | Shop catalog (id, label, cost, category) — server-side source of truth for prices | Read-only |
| `personal_records` | Self-reported best weight × reps per exercise, with date | Read + delete own rows; insert only via `log_pr` |
| `strava_connections` | OAuth tokens and athlete info | No client access at all — service role only |

Full column definitions and constraints live in the migration files
themselves; they're the source of truth, not this document.

---

## 6. Features

### Progression
Five rank tiers — **Bronze → Silver → Gold → Platinum → Apex** — mapped from
10 levels with Roman-numeral sub-ranks (`src/lib/ranks.js`): Bronze II/I,
Silver II/I, Gold II/I, Platinum III/II/I, and a single unnamed Apex at
level 10. Each tier has a glow color and an emblem (`RankEmblem.jsx`).
A monthly streak calendar, a 14-day XP area chart, and 16 badges
(`src/lib/badges.js`) round out the retention surface.

### Avatars
Layered SVG rendered at runtime — not shipped sprites. Two separately drawn
body rigs (`src/components/avatar/layers/BaseBody.jsx` for male,
`BaseBodyF.jsx` for female — the female rig is a distinct character, not a
recolor: narrower ribcage with a waist pinch, hip flare, sports-bra +
leggings kit, slimmer limbs, softer facial features) × 5 classes (Warrior,
Mage, Archer, Knight, Ninja) × 5 gear tiers, plus 6 skin tones and
per-body hairstyles (4 for the male rig, 5 for the female rig, each with 4
color options). Both rigs share fixed gear anchor points — deltoid centers,
head bounding box, belt line — so all 25 class×tier gear sets fit either
body without duplicating a single piece of art. `avatar_config` is
versioned (currently v3, `{version, class, body, skin_tone, hair}`) and
`migrate.js` upgrades older shapes on next login. Art is reviewed via
`scripts/render-avatars.mjs`, which rasterizes contact sheets for every
combination using `@resvg/resvg-js`.

### Coach G (AI coaching)
Claude Haiku, called only from the `coach-g` Edge Function so the Anthropic
key never reaches a browser. The system prompt carries the user's profile
(age, weight, height, BMI, goal, experience, gender) pulled server-side —
never trusted from the client — sanitizes it against prompt injection, and
switches to a conservative safety mode for users under 18. Free accounts get
10 requests/month, enforced by counting rows in `ai_request_logs` server-side
(not a client counter). The prompt instructs structured, scannable answers —
tables, bold, headings, and occasionally a native chart via a fenced
` ```chart ` JSON block that the frontend renders with recharts — and answers
render through a custom markdown component (`CoachMarkdown.jsx`) instead of
literal text. Premium unlocks a "snap a meal" feature: a photo uploaded to
the private `meal-photos` storage bucket gets analyzed by the same model for
calories/macros/health score.

### Personal records
Self-reported best weight × reps per exercise, with date, a "PR!" chip for
records set in the last 7 days, a rotating motivational quote, and confetti
on a new record. Backed by the `log_pr` RPC (§4/§5) — awards the
`record_setter` and `record_breaker` badges but no XP or coins by design.

### Payments
Stripe subscriptions at AED 29.99/month or AED 214.99/year. `create-checkout`
discovers active prices from the Stripe API at request time (cached 5
minutes) rather than hardcoding price IDs, so rotating Stripe prices doesn't
require a redeploy. `stripe-webhook` is signature-verified and handles
`checkout.session.completed`, `invoice.paid` (self-healing renewal),
`customer.subscription.deleted`, and `invoice.payment_failed`.

### Store compliance ("reader app" pattern)
The native iOS/Android shells never sell or link to Premium purchases —
`src/lib/platform.js` sets `hidePurchases = Capacitor.isNativePlatform()`,
and `Premium.jsx`/`PremiumModal.jsx` hide the CTA accordingly. Subscriptions
are sold on the web only and unlock in the apps on login — the same pattern
Netflix and Spotify use to avoid the platform's in-app-purchase cut, and the
reason Apple's 3.1.1 and Google's equivalent digital-goods rules don't apply
here. Native Google sign-in uses the system browser plus a
`online.gamefit.app://` deep link, since Google blocks OAuth inside embedded
webviews.

### Account deletion
`delete-account` Edge Function cancels any active Stripe subscription, best-
effort removes meal photos from storage, and deletes the Supabase auth user
(everything else cascades via foreign keys). Required by Apple 5.1.1(v) and
Google Play's account-deletion policy, which also requires a public web path
— `/delete-account` — in addition to the in-app flow.

### Onboarding
A 10-step flow: gender (picks the avatar body rig), class, age, weight (with
live BMI), height, fitness goal, experience level, weekly training target,
a look customizer + reveal, and health-app integrations. Strava is real
OAuth; other integrations show "Soon" rather than a fake "Connected" state.

---

## 7. Screens (routes)

| Route | Screen | Notes |
|---|---|---|
| `/` | Splash | |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth | Google OAuth available on both login and register |
| `/onboarding` | 10-step onboarding | See §6 |
| `/dashboard` | Home | Rank, XP progress, streak, quick actions |
| `/train` | Workout logging | Timer flow + `CompletionScreen` (confetti, count-up XP/coins, badge unlocks) |
| `/coach` | Coach G | Plan / Nutrition / Chat tabs |
| `/leaderboard` | Leaderboard | All-Time and This Week, own rank pinned with a percentile |
| `/marketplace` | Coin shop | Cosmetic accessories |
| `/avatar` | Avatar customization | Avatar / Shop / Connect tabs; body, class, skin, hair pickers |
| `/profile` | Profile | Stats, Personal Records, Badges, Account settings |
| `/monthly-summary` | Monthly recap | |
| `/premium` | Subscription upsell + checkout | Hidden in native builds |
| `/admin` | Internal admin | Not linked from the main nav |
| `/privacy`, `/terms` | Legal | Marked "DRAFT — pending legal review" in-app |
| `/delete-account` | Public account-deletion instructions | Required by Google Play |
| `/strava/callback` | OAuth return handler | |
| `/avatar-coach`, `/avatar-gallery` | Internal/dev tools | Not part of the main user flow |

---

## 8. Repository layout

```
src/
  components/avatar/     layered SVG avatar system (rigs, hair, class gear, tiers, palettes)
  components/gamefit/    app-specific UI (rank emblem, streak calendar, records, coach markdown…)
  components/ui/         Radix/shadcn primitives
  lib/                   GameFitContext (global state), ranks, badges, validation, analytics
  pages/                 one file per route
supabase/
  migrations/            schema, RLS, column grants, economy RPCs, in chronological order
  functions/              coach-g, create-checkout, stripe-webhook, strava-auth, delete-account, _shared
scripts/
  render-avatars.mjs           avatar art-review contact sheets
  generate-brand-assets.mjs    icons, favicons, splash screens, OG image from the brand mark
  store-screenshots.mjs        App Store / Play Store screenshots at required resolutions
  readme-assets.mjs            README hero image + screenshots
docs/
  STORE_SUBMISSION.md    App Store / Play Store compliance checklist and pre-written listing answers
  PROJECT_OVERVIEW.md    this file
android/  ios/            Capacitor native shells, app id online.gamefit.app
LAUNCH_CHECKLIST.md       owner-action items before public launch
CLAUDE.md                 session handoff / current state for future work
README.md                 public-facing project intro
```

---

## 9. Deployment & environment

- **Frontend:** Vercel, auto-deploys `main`. `vercel.json` rewrites all
  paths to `index.html` so client-side routes resolve on direct load.
- **Backend:** Supabase project `bigqoiekozxfgiznoedm` (`eu-central-1`).
  Free tier — auto-pauses after ~1 week of inactivity; has happened once
  before and needed a manual restore from the dashboard.
- **Local dev:**
  ```bash
  npm install
  cp .env.example .env.local   # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  npm run dev
  npx supabase link --project-ref YOUR-PROJECT-REF
  npx supabase db push
  npx supabase functions deploy
  ```
- **Server secrets** (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, Strava and Resend credentials) live only in the
  Supabase dashboard under Edge Functions → Secrets — never in this repo or
  `.env.local`.
- **Scripts:** `npm run dev` / `build` / `lint` / `typecheck`.

---

## 10. Current status

**Live and working end to end:** accounts, onboarding, workout logging and
the full server-side economy, AI coaching, Stripe checkout and webhook,
personal records, account deletion, PWA install, and native shell builds
from the same codebase.

**Not done, disclosed rather than hidden:**

- Neither app has been submitted to the App Store or Play Store —
  `docs/STORE_SUBMISSION.md` has the checklist and pre-written listing copy.
- `/privacy` and `/terms` are drafts, not lawyer-reviewed (banner shown
  in-app).
- iOS builds need a Mac; the owner is on Windows, so Codemagic's free tier
  (cloud Mac builds from the GitHub repo) is the documented path.
- Automated QA (Playwright + direct API tests against the live backend)
  exists; a full pass on physical devices does not yet.
- Domain cutover from the old Base44 app (`gamefit.online`) to this Vercel
  deployment hasn't happened.
- Auth emails need their redirect URLs configured in the Supabase dashboard
  (Authentication → URL Configuration) — the code sends an explicit
  `?verified=1` return path, but the project's allow-list has to include it.
- The Supabase auth email templates are still the default unbranded ones.
- Marketplace is a placeholder; a friends leaderboard is teased but not
  built; the avatar has a known shoulder-seam artifact at large render
  sizes.

See `LAUNCH_CHECKLIST.md` for the full numbered list of remaining
owner-only actions, and `CLAUDE.md` for the most recent session-by-session
history of what changed and why.
