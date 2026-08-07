# GameFit — Handoff / Session Context

> Read this first in any new session. It's the current state of the world,
> not aspirational — update it whenever a phase, checkpoint, or major fact
> changes. `ARCHITECTURE.md` is the older, now-stale planning doc from before
> the Supabase migration; this file supersedes it for "what's true today."

## What GameFit is

A mobile-first fitness app that turns workouts into an RPG: log a workout →
earn XP/coins → keep a streak → level up through ranks (Bronze → Silver →
Gold → Platinum → Apex, each with Roman-numeral sub-ranks) → evolve a
layered SVG avatar (5 classes × 5 tiers) → chat with an AI coach ("Coach G").
Premium (Stripe, AED 29.99/mo or AED 214.99/yr) unlocks unlimited AI coaching.

Founder (the user) is a **non-expert coder** — explain things in plain
English, avoid jargon dumps, keep them informed of tradeoffs rather than
silently deciding for them. They're budget-conscious (free/cheap tiers) and
want branch → PR-style → merge discipline with no scope creep.

## Stack (current, live)

| Layer | Tech | Where |
|---|---|---|
| Frontend | Vite + React 18, Tailwind, Radix/shadcn, framer-motion, recharts, canvas-confetti | `src/` |
| Hosting | Vercel, auto-deploys `main` | https://gamefit-app.vercel.app |
| DB + Auth | Supabase Postgres, RLS + column-level grants, email + Google OAuth | `supabase/migrations/` |
| Server economy logic | Postgres RPCs (`SECURITY DEFINER`) — XP/coins/streaks/badges/purchases never trust the client | `supabase/migrations/20260706120003_functions.sql` |
| Edge Functions (Deno) | `coach-g`, `create-checkout`, `stripe-webhook`, `strava-auth`, `delete-account` | `supabase/functions/` |
| Payments | Stripe subscriptions, AED prices discovered dynamically (no hardcoded price IDs), signature-verified webhook | `supabase/functions/create-checkout`, `stripe-webhook` |
| AI coach | Claude Haiku, called only server-side, 10/mo free cap enforced in DB | `supabase/functions/coach-g` |
| Analytics/monitoring | PostHog + Sentry, both env-key-gated no-ops until keys are added | `src/lib/analytics.js` |
| Native shells | Capacitor 7, `android/` + `ios/` scaffolded, app id `online.gamefit.app` | `capacitor.config.ts` |

Old Base44 app (`gamefit.online`, repo `muhammet-tm/gamefit-dev`) is still
live and untouched — DNS cutover to this app is a deliberate, not-yet-taken
step (see Next Steps).

## Why the migration happened

The Base44 app trusted the client for XP/coins/streaks/badges — any user
could edit browser state to cheat, and RLS-equivalent protection didn't
exist (any logged-in user could read other users' profiles, including Strava
tokens). Rebuilding the economy server-side needed real DB transactions and
local testing, which Base44 couldn't offer. Decision: migrate to
Supabase + Vercel in a fresh repo, keep Base44 live until this one passes QA.

## Phases completed (all 5 of the original master plan)

1. **Foundation** — Supabase project, schema, RLS, column-level grants,
   economy RPCs, Edge Functions, Stripe webhook, frontend swap off Base44 SDK.
   E2E-tested via `scratchpad/e2e_test.py` (custom Python hitting live REST/
   RPC/Function endpoints) — 27/27 passing after fixing a Postgres
   `array_append` bug (`v_badges || 'text'` doesn't work; must be
   `array_append(v_badges, 'text')` — malformed-array-literal errors on every
   workout log until fixed in `20260707130001_fix_array_append.sql`).
2. **Security hardening** — zod validation (`src/lib/validation.js`), honest
   Premium upsell (routes to real checkout instead of faking an unlock).
3. **Avatar system** — layered SVG, 5 classes × 5 tiers × **2 bodies**,
   `src/components/avatar/`.
   **2026-08-07**: added a genuinely separate female rig (`layers/BaseBodyF.jsx`)
   — narrower ribcage with a waist pinch, hip flare, sports-bra + leggings kit,
   slimmer limbs, softer face (lashes, arched brows, fuller lips, blush). It is
   NOT a reskin. Critical constraint if you touch either rig: **both bodies
   share gear anchors** — deltoid centres (66,78)/(134,78), head box y11-57,
   belt line y128-140 — so all 25 class×tier gear sets fit both without
   duplicated art. Break those anchors and pauldrons/helms/belts float.
   Five feminine hair styles (long, bob, braid, bun, wavy) live in
   `layers/hair.js` alongside the four male ones; styles are per body
   (`HAIR_STYLES_BY_BODY`). **Front-view lesson**: hair in the `back` slot
   below the jaw is completely occluded by the torso and arms — long styles
   must drape in the `front` slot, outside the neck but inside the pauldron
   line (x83/117), or every style renders as an identical cap.
   `avatar_config` is now **v3** (`{version:3, class, body, skin_tone, hair}`);
   `migrate.js` upgrades v1/v2 on next login and takes the profile gender as a
   hint for which body to assign.
   Went through 4 rounds of headless-rendered art review (`@resvg/resvg-js` +
   `react-dom/server`, script now at `scripts/render-avatars.mjs` — **note:
   this file was edited outside this session**, currently a dev tool that
   rasterizes 3 contact sheets: all 25 class×tier combos, a skin/hair matrix,
   and an accessories sheet on Knight T3. If asked to re-review avatar art,
   run `npx tsx scripts/render-avatars.mjs [outDir]` and inspect the PNGs).
   Most recent round added realistic facial features (iris/pupil/catchlight,
   hair-colored eyebrows, lip catchlight, cheekbone/chin shading) and rebuilt
   all 4 hair styles with a `--av-hair-light` highlight variable.
4. **Retention/UX** (Liftoff-inspired) — rank ladder (`src/lib/ranks.js`,
   `RankEmblem.jsx`), monthly streak calendar, real leaderboard backed by
   `get_leaderboard` RPC, workout completion screen with confetti + count-up,
   14-day XP chart, onboarding rework (class picker, weekly-target step).
   **2026-08-07 follow-up**: onboarding expanded to 10 steps at the user's
   request (Base44-parity questionnaire) — step 0 is now a required gender
   pick ("I am..." ♂/♀ cards) that saves `profiles.gender` (Coach G already
   sent gender to Claude but it was always null → "unknown"), syncs the
   avatar's starting hair (female→ponytail, male→short, same rule as the
   legacy config migration), and the integrations step was de-faked: the old
   "Connected ✓" toggles wrote bare strings into `connected_apps` without any
   OAuth (phantom Strava connection on the Avatar screen); now Strava runs
   the real OAuth (profile saved first), others show "Soon". Verified with a
   22/22 Playwright walkthrough (`scripts`-style script, run from repo root
   because Playwright resolves from repo node_modules).
5. **Production readiness + App Store/Play Store compliance** — see below.

## Phase 5 detail: store compliance (most recently shipped, verified live)

**Compliance model**: apps never sell or link to Premium purchases inside
the native shells (Apple 3.1.1 / Google's equivalent digital-goods rule).
People subscribe on the website; Premium unlocks in the apps on login. Same
pattern Netflix/Spotify use to avoid the platform's IAP cut. Implemented via
`src/lib/platform.js` (`hidePurchases = Capacitor.isNativePlatform()`),
applied in `Premium.jsx` and `PremiumModal.jsx`.

Shipped and **verified live on gamefit-app.vercel.app**:
- Real account deletion (`supabase/functions/delete-account`) — cancels
  Stripe sub, wipes storage + DB via cascade, deletes the auth user. Public
  page at `/delete-account` (Google Play requires an in-app path *and* a web
  resource).
- Native Google OAuth via system browser + `online.gamefit.app://` deep link
  (Google blocks OAuth inside embedded webviews — this silently breaks most
  naively-wrapped apps).
- Legal pages `/privacy`, `/terms` — **marked "DRAFT — pending legal
  review"** in `LegalLayout.jsx`; do not represent these as lawyer-reviewed.
- Full PWA (manifest, network-first service worker `public/sw.js`), SEO
  (`robots.txt`, `sitemap.xml`, OG/Twitter meta, JSON-LD).
- Generated brand kit (`scripts/generate-brand-assets.mjs` — lightning-bolt-
  through-dumbbell mark) → all PWA/favicon/OG/Capacitor source images.
- PostHog + Sentry wired through the funnel (Login, Premium, Profile, Coach,
  GameFitContext) — inert until `VITE_POSTHOG_KEY`/`VITE_SENTRY_DSN` are set.
- Capacitor native projects scaffolded (`android/`, `ios/`) with icons/
  splashes generated.
- 12 store screenshots captured via Playwright (`scripts/store-screenshots.mjs`)
  at exact Apple (1290×2796) and Play resolutions, in `store-assets/`.
- Reference docs written: `docs/STORE_SUBMISSION.md` (compliance checklist,
  platform fees, build steps, pre-written listing answers) and
  `LAUNCH_CHECKLIST.md` (numbered owner-action list + honest "known
  limitations" section).

All merged to `main`, pushed, Vercel bundle confirmed deployed
(`index-01qmpXQy.js` at last check), production endpoints spot-checked 200 OK.

## Known limitations (disclosed, not hidden)

- **iOS builds need a Mac** — user is on Windows. `docs/STORE_SUBMISSION.md`
  recommends Codemagic's free tier (cloud Mac builds from the GitHub repo).
- **No real-device QA yet** — only Playwright (real browser engine) and
  DOM-level automated checks have run. The in-app browser-pane testing tool
  used for most of this session **freezes `requestAnimationFrame` on hidden
  tabs**, so Framer Motion onboarding transitions and the workout timer
  screen could not be visually verified there; worked around with headless
  rendering (avatars) and Playwright (store screenshots), but a real-phone
  walkthrough is still outstanding.
- Legal pages are drafts, not lawyer-reviewed.
- Engagement emails not scheduled; marketplace is a placeholder; friends
  leaderboard is teased but not built; avatar has a known shoulder-seam
  artifact at large render sizes; QA test account needs cleanup before
  public launch.

## Open issues / things to watch

- **⚠️ Supabase project is PAUSED (discovered 2026-08-07)** —
  `bigqoiekozxfgiznoedm.supabase.co` is NXDOMAIN globally (free-tier
  auto-pause after ~1 week idle; last activity was ~19 July). The Vercel
  frontend is up but every login/API call fails until the owner restores
  the project at supabase.com/dashboard (data is kept; free-tier restores
  work within 90 days). After restore: re-run the live gender-write check
  (`gender_write_test.py` pattern — QA login, PATCH gender, read back,
  restore) and spot-check login + workout logging. Consider preventing
  recurrence: Supabase Pro, or a weekly keep-alive ping (e.g. GitHub
  Actions cron hitting a REST endpoint) — owner decision, not yet made.

- `scripts/render-avatars.mjs` was modified outside this session (currently
  in good, working state per the file listing above) — if avatar art work
  resumes, read it fresh rather than assuming the version described in old
  history.
- Two odd untracked items sitting in the repo root, **not created by this
  session's work and not investigated** — flag to the user if they come up:
  `CLAUDE.MD.md` (empty, 0 bytes) and `gamefit-app/` (looks like an Obsidian
  vault — `.obsidian/`, `Welcome.md`, `.base` files). Likely artifacts of
  opening this folder in Obsidian, unrelated to the codebase. Left untouched.

## Exact next steps (owner-only actions — I cannot do these)

From `LAUNCH_CHECKLIST.md` / `docs/STORE_SUBMISSION.md`, in rough order:

1. **Web launch prep**: switch Stripe to live mode, create PostHog + Sentry
   accounts and add the env keys, cut over `gamefit.online` DNS from Base44
   to this Vercel deployment, get the legal pages reviewed by an actual
   lawyer, brand the Supabase auth emails.
2. **Manual device QA**: walk onboarding + log a workout with confetti on a
   real phone (animation-heavy flows my tooling couldn't render).
3. **Store submission**: create Apple Developer ($99/yr) and Google Play
   ($25 one-time) accounts; build Android in Android Studio locally; build
   iOS via Codemagic (no local Mac); fill listings using the pre-written
   answers in `docs/STORE_SUBMISSION.md` (category, age rating, privacy
   nutrition labels, data safety form — link to `/delete-account`).
4. **Pre-launch cleanup**: delete the QA test account and its data from
   Supabase before going public.

No new unrequested work is queued — the next session should pick up from
whichever of the above the user has acted on, or from a fresh instruction.

## Working rules established this project (don't relitigate)

- Branch → merge (`--no-ff`) → push `main` → Vercel auto-deploy. Never push
  broken builds; run `npm run lint` + `npm run build` before merging.
- Never print secrets/env values in chat or commits.
- Server-authoritative economy is non-negotiable — any new gameplay
  mechanic (new currency, new reward) must be a Postgres RPC, not client math.
- Explain technical tradeoffs in plain English; flag uncertain product
  decisions to the user rather than guessing silently, but don't block on
  every small reversible decision — use judgment and move.
- Verify claims: E2E test the economy, curl-check deployed endpoints,
  actually run `npm run build`, don't just say "should work."
