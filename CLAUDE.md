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

## Design system (phase 1 of the redesign — shipped 2026-08-14)

The app and the marketing site share one palette and one type system. Both
were swapped away from the original lime-on-near-black design, which was
disciplined but is the most templated look in fitness software.

**Palette** (`src/index.css`, mirrored in `gamefit-web/src/styles/tokens.css`):

| Token | Dark | Light | Role |
|---|---|---|---|
| `--gf-bg-primary` | `#0B1A24` | `#EDF2F5` | Page ground |
| `--gf-bg-surface` | `#112532` | `#FFFFFF` | Cards |
| `--gf-bg-elevated` | `#1A3242` | `#DFE8EE` | Inputs, raised |
| `--gf-text-primary` | `#F2F5F7` | `#0B1A24` | Text |
| `--gf-text-secondary` | `#88A5B7` | `#4A6577` | Muted |
| `--gf-gold` | `#F4B044` | `#F4B044` | The single accent — fills, rank, XP |
| `--gf-gold-text` | `#F4B044` | `#8A5A06` | Gold **as text** (see below) |
| `--gf-ember` | `#E0680E` | `#B34D06` | Streaks, intensity |

Three rules that are easy to get wrong:

1. **Gold cannot be one value across both themes.** `#F4B044` is ~1.9:1 on
   white. Fills keep the brand gold with navy text (9.38:1); gold *text* on a
   light surface must use `--gf-gold-text`. Same split for ember.
2. **The surface is the binding ground, not the page.** Tier labels and card
   text sit on `--gf-bg-surface`, which is lighter. Bronze shipped for one
   build at `#B5754A` — 4.72 on the page, 4.20 on a card — and axe caught it.
   It is now `#C08657`.
3. **Ember is 3.90 on `--gf-bg-elevated`.** On that surface it is for fills
   and text ≥18px only.

Violet `#7C3AED` is gone entirely. It measured 3.36:1 and failed AA for body
text, which the old `DESIGN.md` already recorded as a known failure. Apex tier
moved from violet to ember as a result. Tier colours live in
`src/components/avatar/tiers.js` and are mirrored in the site's `tokens.css` —
**change both together**.

**Type**: Archivo (variable, width axis, set at ~118%) for display, Hanken
Grotesk for UI and body, JetBrains Mono for figures. The app loads these from
Google Fonts; the site self-hosts them via `@fontsource` so its CSP and the
GDPR posture are unchanged.

Old token names (`--gf-green`, `--gf-amber`, `--gf-purple`) survive as aliases
so the swap landed in one commit. They are removed as components migrate.

Contrast is verified against the rendered DOM, not the token values: a scanner
resolves each text node's actual painted background through alpha layers and
checks it at the right threshold for its size and weight. Zero failures in
both themes. The site additionally runs axe on every route in CI.

Phases 1-5 are shipped and live on both surfaces. **Phase 6 (avatars) is done
on branch `feat/avatars`, not yet merged** — see below.

## Phase 6: avatars (branch `feat/avatars`, 2026-08-14)

The diagnosis came from rendering contact sheets on the grounds the avatars
actually sit on, which is the thing to repeat before touching this again:

```bash
npx tsx scripts/render-avatars.mjs <outDir> --bg=#1A3242
```

`--bg` matters. The script used to bake `#161A22`, the near-black phase 1
deleted, so every previous art review judged the rigs against a background that
no longer exists. The real grounds are `#1A3242` (AvatarScreen hero), `#112532`
(leaderboard rows, class picker) and `#DFE8EE`/`#FFFFFF` in light theme.

Three things were wrong, and only the first was suspected:

1. **Colour.** Every class's trim was under 1.35:1 on a card and ninja's
   *primary* was 1.05 — invisible. `palettes.js` and the five class art files
   each kept private hex tables that the phase 1 token migration never reached.
   `#9664FF` turned out to be every class's tier-5 aura, not mage's, so all
   five glowed the same violet.
2. **Skin.** Ebony measured 1.18 on a dark card, porcelain 1.13 on a light one.
   Not fixable by recolouring: skin tone is user identity. Solved structurally
   with a contour.
3. **Identity.** Every class put all its headwear at tier 4, so at 46px — the
   size people see each other at — four of five classes were the same picture.

What shipped:

- `CLASS_PALETTES` / `RIG_PALETTES` carry dark and light variants. `classColors(cls, theme)`
  and `rigColors(theme)` resolve them; `avatarCssVars`/`bakeAvatarVars` are
  shared by `<Avatar/>` and the render scripts so the two cannot drift.
- A `text` value per class, because the pickers colour *labels* with it and a
  label answers to 4.5:1, not the 2.2:1 a filled shape needs. Same split as
  `--gf-gold` / `--gf-gold-text`.
- **The contour** (`--av-contour`): a 2.4px stroke with `paint-order: stroke`
  on the silhouette shapes of both rigs. It sits opposite the ground — light on
  dark, dark on light — and that direction is load-bearing. No single line
  colour clears all six tones; it does not need to, because a body reads if the
  tone beats the card OR the line beats both the card and that tone. Invert
  either value and the tones it exists to rescue vanish.
- Class identity at tier 1, material escalating after: warrior bone horns →
  steel helm, mage cowl → hood up, archer feather + cap → cowl, knight mail
  coif → plate helm, ninja band + tails → charged seam + mask. They read as
  spikes / point / diagonal / mass / horizontal. Knight is deliberately the one
  with no spike.
- `cumulativeGear` gained `supersedes`, so a later tier *replaces* a piece
  instead of drawing over it (no bone horn poking out from behind steel).
- `<Avatar interactive/>` (tap/click/Enter) and `revealFromTier` (rank-up gear
  animates in). **The reaction clears on a timer, not only `animationend`** —
  under `prefers-reduced-motion` the rule is `animation: none`, so
  `animationend` never fires and the state would latch on forever after one tap.
- `scripts/check-avatar-contrast.mjs` gates all of it: ground contrast, label
  contrast, pairwise class separation (ΔE > 25), intra-kit separation, and the
  skin/contour disjunction. Exits non-zero. **Run it after any palette edit.**
- `/avatar-gallery` (dev-only route) gained an interaction bench, because both
  behaviours otherwise only exist behind auth.
- `store-assets/` and `gamefit-web/public/screens/` regenerated. Only dashboard,
  avatar and leaderboard changed; the other three are byte-identical, which is
  the expected shape of that diff.

Fixed in passing: the right arm's shadow ran ~7px past the arm (invisible until
the contour drew where the arm ends), and `LevelUpOverlay` announced "Avatar
evolved to Tier N" on any level-up above tier 1 — levelling 7→8 stays inside
tier 4, so it claimed an evolution that had not happened.

Still open on this branch: **shop accessories have no light-theme variants.**
Ten item-identity colours remain hardcoded in `layers/accessories.js`; wings at
`#FFFFFF` measure 1.0 on a white card, and these are items users pay coins for.
Each item's identity colour is its own design decision, so it was left separate.

Not in any phase yet, flagged rather than forgotten: ~109 emoji remain in
Onboarding, AvatarScreen, Coach, Marketplace, AccessoryShop, NutritionTab
and NotificationsPanel. AccessoryShop and Marketplace are cosmetic item art
and belong with the accessory pass above; the rest need their own. The
regenerated store screenshots show these plainly — the Avatar screen header
alone carries 🎮 🎭 🛒 🔗 ⚔️.

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

- **Regenerating the marketing site's screenshots is now one command**
  (resolved 2026-08-14). `gamefit-web/scripts/capture-screens.mjs` logs in
  with the QA account against a running app dev server and writes
  `public/screens/*-420.webp` and `-840.webp`. Run it whenever the app's
  design changes, or the site silently goes stale — which is exactly what
  happened after the palette swap. `scripts/store-screenshots.mjs` in this
  repo does the same job for `store-assets/`.

- **`.claude/` broke `npm run lint` and now has a global ignore.** ~269 agent
  skills are installed there, and ESLint's flat config was linting their JS.
  `eslint.config.js` gained an `ignores` block covering `.claude/`, `dist/`,
  `android/`, `ios/`, `store-assets/`, `scratchpad/`. If lint starts failing
  on a file nobody wrote, check that list first.


- **Supabase was restored by the owner on 2026-08-08** — the project is
  Healthy again (eu-central-1 Frankfurt, nano compute). It had auto-paused
  after ~1 week idle on the free tier. Login and the QA account both work;
  the store-screenshot script ran against it successfully. Recurrence is
  still unprevented — Supabase Pro or a weekly keep-alive ping (e.g. a
  GitHub Actions cron hitting a REST endpoint) remains an open owner
  decision.

- **⚠️ The live app is behind Vercel's Security Checkpoint (found
  2026-08-08)** — a plain Playwright visit to
  `gamefit-app.vercel.app/login` gets a bot-detection challenge page with
  no form on it, so `scripts/store-screenshots.mjs` cannot log in against
  production. Run it against `http://localhost:5173` instead (it takes a
  base URL argument). Worth checking whether Attack Challenge Mode is
  deliberately on in the Vercel project, since it also affects anything
  else automating against production.

- **Edge cache can make a deploy look like it failed** — after pushing,
  `gamefit-app.vercel.app` served `X-Vercel-Cache: HIT` with an age of
  hours, so the bundle hash looked unchanged. Query-string busting did not
  defeat it. Check the deployment-specific URL or the Vercel dashboard
  rather than concluding a deploy did not land.

- `scripts/render-avatars.mjs` was modified outside this session (currently
  in good, working state per the file listing above) — if avatar art work
  resumes, read it fresh rather than assuming the version described in old
  history.
- Two odd untracked items sitting in the repo root, **not created by this
  session's work and not investigated** — flag to the user if they come up:
  `CLAUDE.MD.md` (empty, 0 bytes) and `gamefit-app/` (looks like an Obsidian
  vault — `.obsidian/`, `Welcome.md`, `.base` files). Likely artifacts of
  opening this folder in Obsidian, unrelated to the codebase. Left untouched.

## Sibling project: the marketing site (started 2026-08-08)

The GameFit marketing site is a **separate repo at `D:\gamefit-web`**, not
part of this codebase. Built from scratch to replace the Base44 site whose
source files no longer exist.

- Astro 7 + Preact + Tailwind 4, static output, deployed to Vercel, no
  backend and **no connection to this project's Supabase** — deliberately,
  so the site stays up regardless of the app's database state.
- Forms go to Web3Forms, not to Postgres.
- 191 Playwright tests covering accessibility, the CSP under real headers,
  responsive behaviour and asset budgets.
- `DESIGN.md` there is the design system; the site reuses this app's `--gf-*`
  palette and the real rank-tier colours from `src/components/avatar/tiers.js`.

**It corrects claims this app's own marketing materials got wrong.** The old
site advertised OpenAI while `coach-g` calls Anthropic Claude Haiku 4.5, and
described the avatar as 3D when it is layered 2D SVG. A test there fails the
build if either reappears. `Muhammet_Yalkapov_GameFit_Profile.md` (in the
owner's CV folder, outside both repos) also carries a DOI that 404s — the
working one is `10.1007/978-3-032-23883-2_13`.

Arabic localisation is specced but not built; it is planned as a second
phase.

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
