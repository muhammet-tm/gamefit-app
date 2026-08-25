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

Shop accessories were finished in a follow-up: `ITEM_PALETTES` carries both
themes, keyed by item rather than class, because a crown's gems are ruby and
sapphire whoever wears them. Two values are exempt from the contrast floor on
purpose — `highlight` and `rubyDark` are shading painted over another item
colour, never over the card, so the parent shape is what must clear it.

## Phase 7: security, SEO and testing pass (shipped 2026-08-15)

Ran the app against a pre-launch security audit and the "vibecoded site"
checklist. **The marketing site passed almost everything; the app was the one
with gaps**, and they were all at the edge. The DB layer was already excellent
— RLS, column grants, `search_path` on every `SECURITY DEFINER`, folder-scoped
storage, a PII-trimmed leaderboard — because it was deliberately rebuilt. The
HTTP layer had never been touched since the Base44 scaffold.

**Explicitly clean, so it isn't re-audited**: SQL injection (all access via
parameterized RPCs), XSS sinks (zero `dangerouslySetInnerHTML`/`eval`/
`innerHTML`), privilege escalation (`role` is not in the `grant update` column
list, so a user cannot make themselves admin), IDOR, secrets in git history
(both repos), client key exposure (anon key only), password hashing.

What was wrong and is now fixed:

- **No security headers at all** beyond the HSTS `.vercel.app` gets free. Now a
  full set in `vercel.json` plus a CSP. **The CSP is now enforcing** (flipped
  2026-08-25 — it shipped `Report-Only` with no `report-uri`, so it was neither
  blocking nor collecting anything). `script-src 'self'` works because the
  inline SW registration moved to `public/sw-register.js`; keep it out of
  `index.html`.
- **26 npm vulnerabilities (1 critical, 15 high) → 0.** 14 packages nothing
  imported were removed, incl. `react-quill` (XSS with no published fix) and
  `lodash`. `react-router-dom` 6 → 7 (only patched line). `@capacitor/assets`
  removed — it pulled the whole remaining set and the docs already use
  `npx capacitor-assets generate`. `@capacitor/cli` is pinned **exactly**;
  a caret resolves to nightlies carrying advisories.
- **Edge Function CORS was `*`.** Now an allowlist via `withCors()` in
  `helpers.ts`. **It includes the Capacitor origins** (`capacitor://localhost`,
  `https://localhost`) — drop those and the native apps break while the web
  keeps working. `stripe-webhook` has no CORS by design.
- **Meal-photo bucket had no size/MIME limit.** Now 5 MB + an image allowlist
  on the bucket itself, not after download.
- **The free AI cap was raceable** (count, call Anthropic, insert). Now
  `consume_ai_credit()` with a per-user advisory lock, reserved *before* the
  call and refunded if it fails.
- **Every unknown path returned 200 and redirected home.** Now `NotFound.jsx`.
  The old `src/lib/PageNotFound.jsx` was deleted: unwired, pre-redesign
  palette, and it told users *"the AI hasn't implemented this page yet"*.
- **One `<title>` shared by 20 routes, no `<h1>` on the landing screen.**
  `src/lib/RouteMeta.jsx` sets title/description/canonical per route.
- **Every absolute URL was hardcoded to `gamefit.online`, which is unpointed.**
  All now derive from `VITE_SITE_URL` (default: the Vercel alias) — DNS cutover
  is an env var + redeploy. `robots.txt`/`sitemap.xml`/`llms.txt` are generated
  at build time in `vite.config.js`; the static ones were deleted.
- **First load: 1.8 MB in one chunk → 222 KB across 5** (verified live).
  Routes are `React.lazy`. **Charts are deliberately NOT named in
  `manualChunks`**: Vite emits a `modulepreload` for every *named* chunk, so
  naming it pulled 407 KB of recharts onto the splash screen. Check with
  `grep modulepreload dist/index.html`.
- **The splash logo loaded from `media.base44.com`** — the platform being
  migrated off. Now local.
- **Sign-in form had placeholders and no labels**, and the "Sign In" tab and
  "Sign In" submit button were two buttons with the same accessible name.
  Now `aria-label`s and a real tablist.

Site got an FAQ (with `FAQPage` schema) and a generated `llms.txt`.
**Case studies, reviews and local schema were deliberately not added** —
GameFit has no customers yet and no premises, so all three would be fabricated.

### Testing (new — there was none)

`tests/` holds 88 Playwright tests over desktop Chrome and mobile Safari, plus
`.github/workflows/ci.yml` running lint, guards, build, `npm audit
--audit-level=moderate` and both browsers on every PR.

Two things not to undo:
- Tests run against the **production build**, not the dev server — the dev
  server doesn't split, generate SEO files, or substitute the site URL.
  `reuseExistingServer: false` for the same reason it's false on the site.
- Several assertions check **content-type and shape, not status**. Both
  `vite preview` and the Vercel SPA rewrite answer any unknown path with
  index.html and a 200, so a 200 is not evidence a file exists. The source-map
  check failed exactly that way while no `.map` file existed at all.

Authenticated journeys **skip** unless `E2E_EMAIL`/`E2E_PASSWORD` are set
(repo secrets), so CI is green on forks. They deliberately don't log workouts —
real writes would pollute the live leaderboard.

## Phase 8: Turnstile captcha (branch `feat/turnstile-captcha`, 2026-08-15)

Closes the last item on the pre-launch security list. Cloudflare Turnstile,
chosen because Supabase supports it natively and the free tier is unmetered.

**Supabase gates six auth endpoints, not one.** The client must attach a token
to every call that reaches `/signup`, `/token?grant_type=password`, `/recover`,
`/resend`, `/otp` and `/magiclink`. It does **not** gate `/verify`. The
authority is the shipped client types, not the docs:
`ResendParams.options.captchaToken` exists, and `VerifyOtpParams`' equivalent is
marked `@deprecated`. Check there before adding or removing a widget.

- `src/components/Turnstile.jsx` renders the widget and exposes an imperative
  `reset()`. **Tokens are single use** — Supabase redeems one when it verifies
  it, so a second submit with the same token fails with "captcha protection:
  request disallowed" rather than the real reason. Every submit handler calls
  `reset()` in `finally`; remove that and one mistyped password soft-locks the
  form. Tokens also expire (~5 min), handled by `expired-callback`.
- The site key is public by design and defaulted in the component;
  `VITE_TURNSTILE_SITE_KEY` overrides it. The secret lives only in Supabase.
- Wired into `Login.jsx` (both modes), `Register.jsx`, `ForgotPassword.jsx`.
  **`Register.jsx` renders two widgets** — the sign-up branch and the OTP
  branch — because `/resend` is gated too and the first widget unmounts when
  the OTP screen appears. They safely share one ref and one token: the branches
  are mutually exclusive, and `handleSubmit`'s `reset()` clears the spent token
  before React renders the second one.
- `vercel.json` CSP gained `challenges.cloudflare.com` in `script-src`,
  `connect-src` and `frame-src`. (The policy is enforcing as of 2026-08-25 —
  see phase 10.)

**Testing.** `playwright.config.js` injects Cloudflare's always-passes test key
`1x00000000000000000000AA` via `webServer.env` (not `VAR=value cmd`, which the
Windows shell that spawns it does not parse). The widget mirrors its state onto
`data-token-ready`, and `waitForCaptcha()` waits on that rather than sleeping.

Two things not to undo:
- **The OTP test skips WebKit deliberately.** Playwright does not intercept
  that cross-origin auth POST in WebKit — verified, not assumed: with an
  identical URL and pattern the handler fires in Chromium and never fires in
  WebKit, so the stub falls through and the call reaches the real project. The
  test also asserts the stub took effect, so if interception ever breaks in
  Chromium too it fails loudly instead of quietly creating accounts.
- **`RouteMeta` publishes `data-route-meta` on `<html>`.** `index.html` ships a
  static `<title>` byte-identical to the one RouteMeta gives `/`, so "non-empty
  title" and "title changed" are both useless as signals that it has run — a
  read landing before React's first commit sees the `/` title on every route.
  The SEO tests wait on that attribute. This race predates the branch (verified
  by stashing) and only surfaced on WebKit, where the gap is widest.

## Phase 9: the husky identity (merged to `main`, shipped 2026-08-19)

The lightning-bolt-through-dumbbell mark is gone from both repos and from the
Hub71 deck. The founder chose a husky mascot and supplied a 1024px reference;
it was redrawn as vector rather than sourced, so it is owned outright — which
matters for an App Store submission where a stock lookalike is someone else's
artwork.

**`src/lib/brand.js` is the only definition.** It holds the mark as shape
descriptors, not as an SVG string, because two consumers need it and must not
drift: `src/components/brand/Logo.jsx` maps them to real JSX elements, and
`scripts/generate-brand-assets.mjs` serialises them for resvg. A string would
have meant `dangerouslySetInnerHTML`, and phase 7 recorded zero such sinks.
`brand/` is **generated**, not vendored — regenerate, never hand-edit.

Five things that are easy to get wrong here:

1. **Gold is two values.** `Wordmark` defaults to `tone="auto"`, painting GAME
   from `currentColor` and FIT from `--gf-gold-text`. Pinning a tone puts
   `#F2F5F7` lettering on the `#EDF2F5` light background at 1.02:1 — invisible.
   `Splash.jsx` is the one legitimate exception and pins `dark`, because it
   paints a literal navy in both themes to match the native splash.
2. **Two mascot rigs, switching at 48px.** The detailed rig's eye catchlights
   are r=5 on a 200-unit grid — 0.4px in a 16px favicon. `<Mascot>` switches on
   `size`; `Logo.astro` on the site mirrors the same threshold. The site's
   header (32px) and footer (36px) both get the simplified rig.
3. **The app icon's navy square is only for the OS.** iOS and Android composite
   against unknown wallpaper. Splash and Login used to show that PNG on screens
   that are already navy, which drew a faint box around the mascot. Both now
   use the bare `Mascot`.
4. **The site is a separate repo with no shared package.** `Logo.astro`
   transcribes the same paths. If the mark changes, regenerate
   `brand/logo-horizontal-on-dark.svg` and carry the data across — do not
   redraw by eye.
5. **`npm run check` in the site catches what `astro build` does not.** The
   build does not typecheck; a bare inferred array literal there failed
   `check` while building fine.

The h1 accessible-name test in `tests/seo.spec.js` gained a third accepted
form — an inline SVG with `role="img"` and `aria-label` — because Splash and
Login now name themselves that way and have no `<img>` or rendered text left.

Fixed in passing: the site's `theme-color` was still `#0D0F14` from before the
palette swap, so mobile browser chrome painted a different navy than the page;
and the site had no `apple-touch-icon`, so "Add to Home Screen" got a
screenshot.

Deck: `deck.template.html` in the Hub71 scratchpad carried the old mark inline
on the cover and closing slides plus the wordmark set in Archivo. All four are
now the drawn identity. PDF is 1.27 MB against Hub71's 10 MB cap, and the
artifact was redeployed to its existing URL.

**2026-08-19 recolor + sharper chin** (owner-requested): the husky is now
gold with deep-navy goggles — `fur: #F4B044` (deliberately the same value as
`--gf-gold`), `frame: #1E3250`; the lenses stay `#A8D9F2` so the pupils
survive — and the chin tapers to a soft point instead of a round arc. The
chin drop is 7 units in the detailed rig but only 4 in the simple one: its
10-unit stroke reaches y199 from an apex of 194, and one unit lower clips
flat against the 200-unit viewBox. Head and muzzle bottom curves must move
together in both rigs or fur peeks out below the white. Native icons were
regenerated with `npx @capacitor/assets@3 generate` **with navy pinned on
all four background flags**, then its two side effects reverted (broken
`public/manifest.json` rewrite, `AndroidManifest.xml` line-ending churn) and
the stray root `icons/` folder deleted — the full recipe is in commit
4c91c80's message. The Hub71 deck was updated the same day: both inline
marks (cover + close) carry the gold identity, and the founding-team slide
gained a full-width "Top 10 selected research" card for the 13th
International Undergraduate Research and Innovation Competition —
owner-stated, recorded with provenance in the scratchpad's FACT_LEDGER.md.
The rebuilt PDF (13 slides, all layout audits clean) replaced the copy in
the owner's Downloads; the artifact redeploy was blocked by the session's
permission mode and may still be pending — check with the owner.

**2026-08-19 hiring plan** (owner's Hub71 advisor asked the deck to show
the founder is not working alone): every document previously said "the
first two hires are engineers", which doubled down on the one discipline
already covered and read as cloning the founder. Replaced with three
hires in three disciplines — senior full-stack engineer (Q1, full-time,
removes bus factor), certified strength & conditioning coach (Q1,
fractional, owns the exercise library and the limits on Coach G's output),
bilingual growth & community lead (Q2, full-time, owns retention) — plus
an explicit deferral of B2B sales until a paid pilot. Slide 9 gained the
plan and moved the advisors to its previously-empty left column; slide 10
gained an AED 150K/60K/40K cash allocation and a runway card. Form answers
q8, q9 and q23 were rewritten to match. **All six answers sit at the form's
200-word ceiling** — adding to one means cutting from it, so re-check with
`wc -w` after any edit. The plan is recorded as a *plan* in the scratchpad
FACT_LEDGER.md, with the headcount arithmetic a reviewer would check.

## Verification commands (run these, don't reason about it)

```bash
npm run verify            # lint + emoji + avatar + build + e2e
npm run test:e2e          # 88 Playwright tests (builds first, ~3 min)
npm run test:e2e:ui       # same, in the Playwright UI
npm run check:avatar      # ground contrast, label contrast, class separation,
                          # kit separation, skin/contour disjunction
npm run check:emoji       # fails on any emoji in UI source (comments exempt)
npm run check:onboarding  # walks the wizard in a real browser (needs dev server)
npm audit                 # must stay at 0
```

Run the suite against production with:
`E2E_BASE_URL=https://gamefit-app.vercel.app npx playwright test`

`check:onboarding` uses Playwright rather than the in-app browser pane for a
specific reason: onboarding is built on AnimatePresence, and that pane freezes
`requestAnimationFrame` on hidden tabs, so exit animations never complete and
the wizard never advances past step one. Anything animation-gated has to be
checked with Playwright.

## Emoji: all gone (2026-08-14)

The ~109 flagged emoji are removed — 101 in UI plus the gender picker's
U+2642/U+2640 — replaced with lucide-react icons across Onboarding,
AvatarScreen, AccessoryShop, NutritionTab, Coach, Marketplace,
NotificationsPanel and mockData's notification titles.

The reasoning, so it isn't relitigated: an emoji is drawn by the OS, not by us,
so the same screen differed across Android, iOS, Windows and macOS; emoji
cannot be themed, being fixed-colour bitmaps in an app where everything else
answers to the palette; and coverage is not guaranteed, which at `text-3xl` and
`text-5xl` means a very visible tofu box. Shop items and notification rows now
carry a `tint` matching the colour the thing actually renders in, so a card
previews its product. Decorative trailing glyphs in copy were deleted rather
than replaced.

`npm run check:emoji` fails the build if any come back.

Emoji: none left. See the phase 6 section above; `npm run check:emoji` keeps
it that way.

## Phase 10: security audit + remediation (shipped 2026-08-25)

Full review of both surfaces against a pre-launch security checklist, then a
remediation pass. Written up in `docs/SECURITY_AUDIT_2026-08-25.md`, which
carries the per-finding status table — read that before re-auditing anything.

**The DB layer was re-verified by attack, not by reading.** Against production
with the QA account: `role`, `total_xp`, `account_type`, `current_streak` and
`stripe_subscription_id` all rejected `42501`, a control write to `first_name`
returned 204 (so the test discriminates), a select across the whole `profiles`
table returned `Content-Range: 0-0/1`, and `strava_connections` returned 403.
Column grants and RLS do what the migrations claim.

Four code fixes, all merged, deployed and verified live:

1. **Strava OAuth had no CSRF `state`.** The callback exchanged any `code` it
   received and bound it to the logged-in user, so an attacker could run consent
   with their own Strava account and send a victim the callback link to bind it
   to the victim's profile. Now a server-minted `crypto.randomUUID()` state,
   stashed in `sessionStorage` before redirect, refused on mismatch. Google
   OAuth is unaffected — Supabase handles PKCE/state internally.
2. **Premium AI was uncapped.** Free was capped and race-safe; premium had no
   ceiling, so one scripted account could run unbounded Anthropic spend. Now
   100 text + 30 meal-analysis per day. **The key insight to preserve:**
   `consume_ai_credit` counts rows matching an *opaque text key* under an
   advisory lock, so a whole new limit dimension is just a new key format
   (`day:YYYY-MM-DD:text`) — no schema change, no migration. Free keeps its
   `YYYY-MM` key, which matters because `GameFitContext.jsx:89` filters on that
   format to draw the "4 / 10" counter; it renders only for `!isPremium`, so
   premium's `day:` rows never reach it. **Change either key format and check
   that counter.** Credit reservation also moved to *after* all validation — it
   used to charge a credit and then return 400 on a malformed request.
3. **Account deletion erased only the first 100 meal photos.** `list()` was
   called once with `limit: 100`, which is the API's **page size, not a total**.
   Storage objects do **not** cascade from `auth.users` (only Postgres rows do),
   so the remainder outlived the account forever as orphaned personal data — a
   GDPR Art. 17 / PDPL erasure failure. Now pages until empty. **The offset
   deliberately stays at 0**: each pass deletes the page it just listed, so the
   window shifts down rather than the cursor moving up — `offset += PAGE` would
   skip every second page. Verified with 105 real objects: 105 removed across
   2 pages, 0 left.
4. **The marketing site had no `Cross-Origin-Opener-Policy`.** The app has set
   it since phase 7. Added and asserted in the site's `tests/csp.spec.ts`.

**Still open, and all owner dashboard actions** — see the audit doc:
Turnstile is still **off** in production (re-confirmed by junk-credential probe
returning `invalid_credentials`), leaked-password protection is still off,
Web3Forms' domain restriction needs confirming, and the QA account needs
deleting pre-launch. One product decision is flagged: **account deletion
requires no re-authentication** — `confirm: 'DELETE'` is a client-supplied
constant, not a control — which needs a branch for Google-OAuth users who have
no password, so it was flagged rather than decided unilaterally.

## Known limitations (disclosed, not hidden)

- **iOS builds need a Mac** — user is on Windows. `docs/STORE_SUBMISSION.md`
  recommends Codemagic's free tier (cloud Mac builds from the GitHub repo).
- **Captcha: the client half is built, the dashboard toggle is the last step.**
  Cloudflare Turnstile is wired into every form that hits a captcha-gated auth
  endpoint (see the phase 8 section). Enabling it is a Supabase dashboard
  setting (Auth → Attack Protection); `config.toml` in this repo is a local-dev
  template and pushing it would wipe hosted auth settings. **Deploy the
  frontend before saving that setting** — enforcement begins the instant it is
  saved, with no grace period, so saving first breaks every login on the live
  site. Verify which state production is in by attempting a login with junk
  credentials: `invalid_credentials` means off, `captcha protection: request
  disallowed` means on.
- **"Prevent use of leaked passwords" is still disabled** (same dashboard page).
  One toggle; checks new passwords against the HaveIBeenPwned corpus.
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

  **2026-08-14 update — this bites harder than it looks, and the deployment
  URL is not the escape hatch.** Verifying the phase 6 push, the alias served
  cached HTML pointing at a bundle that no longer existed, so the asset request
  fell through the SPA rewrite and returned 2879 bytes of *HTML* with
  `Content-Type: text/html`. Grepping that for palette values gives zero hits
  for both the new and the old ones, which reads exactly like a failed deploy.
  Always check `Content-Type` and byte count before believing a content grep.
  Deployment-specific URLs (`gamefit-<hash>-game-fit.vercel.app`) are behind
  **Vercel SSO** and 302 to `vercel.com/sso-api`, so they cannot be curled.

  What works, in order: `gh api repos/muhammet-tm/<repo>/deployments` then
  `/deployments/<id>/statuses` gives the real build state and SHA without any
  Vercel auth. Then re-request the alias until `X-Vercel-Cache: MISS`, and only
  then compare content.

- **RESOLVED 2026-08-14: the marketing site's deploy was landing all along.**
  The previous checkpoint recorded "the site's Vercel deploy is not landing" as
  an unresolved blocker, on the evidence of `X-Vercel-Cache: HIT` with a
  climbing `Age`. That was the cache trap above, not a broken deploy. Verified:
  every recent site deployment reports `state: success` via the GitHub API, and
  the live CSS bundle filename matches a fresh local build exactly
  (`BaseLayout.EE7qYyXt.css` — Astro content-hashes, so an identical name is
  identical content). The regenerated `public/screens/*.webp` also match live
  byte-for-byte. **Do not spend time re-diagnosing this.** Compare content or
  content-hashed filenames; cache headers say nothing about what was deployed.

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
