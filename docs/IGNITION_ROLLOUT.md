# Ignition redesign: change-management plan

Owner decision, 24 September 2026: GameFit moves from the navy-and-gold system
shipped on 14 August 2026 to **Direction A, "Ignition"**, chosen from the five
style directions on the design canvas
(https://claude.ai/artifact/7Y73m884rybbxmekEVQiH6, private to the owner).

Ignition was built from two references: the designmd.app "Fitness App de
Treinos" system (charcoal canvas, red and orange energy, progress rings,
counters, celebration states) and Refero's Peloton analysis (one red action
color on a dark runway). This document records what changes, in what order,
how each step is verified, and how it is undone.

## What changes

| Layer | Before | After |
|---|---|---|
| Ground (dark) | Navy `#0B1A24` / `#112532` / `#1A3242` | Charcoal `#141416` / `#1E1E21` / `#28282C` |
| Ground (light) | `#EDF2F5` / `#FFFFFF` / `#DFE8EE` | `#F4F4F5` / `#FFFFFF` / `#E9E9EC` |
| Text | `#F2F5F7`, muted `#88A5B7` | `#F5F5F4`, muted `#A1A1AA` |
| Primary action | Gold fill, navy text | Red-to-orange gradient `#D92B2B` to `#C8470E`, white text |
| Heat (streaks, coins) | Ember `#E0680E` | Orange `#FF6B00` (dark), `#EA580C` fill and `#B13A09` text (light) |
| XP and rewards | Gold `#F4B044` | Unchanged |
| Errors | Coral `#E5614A` | Unchanged |
| Type | Archivo (display), Hanken Grotesk (UI) | Poppins 400 to 800 for both |
| Figures | JetBrains Mono | Unchanged |

## What deliberately does not change

- **Gold stays `#F4B044`.** The mockups used `#FFC107` for XP. The two are
  near-identical on charcoal, and keeping gold means the husky mascot (whose
  fur is defined as the same value), the Gold rank tier and 52 existing usages
  all remain correct without regenerating any brand asset.
- **Rank tier colors** (`src/components/avatar/tiers.js`, mirrored in the
  site's `tokens.css`) are rank identity, not theme. They are re-checked
  against the new grounds, not changed.
- **The husky mark and the wordmark.** Recoloring the mark is a separate brand
  decision (see Follow-ups).
- **Information architecture, routes, copy and analytics events.** This is a
  visual change only.
- **The light theme stays.** Ignition was designed dark-first; the light
  palette above is derived from it so the existing theme toggle keeps working.

## Sequence

Each repository gets one branch, `feat/ignition-redesign`, with one commit per
step so a reviewer can read the change in order and any single step can be
reverted.

### App (`gamefit-app`)

1. **Plan** (this document).
2. **Tokens and type.** `src/index.css`: Ignition values for both themes, the
   shadcn HSL variables, chart tokens, Poppins, and a `.gf-cta` utility for the
   action gradient. Token names are kept, so every component that already
   reads a token changes in the same commit.
3. **Hardcoded colors.** About 250 inline values bypass the tokens. The navy
   neutrals map one-for-one to the charcoal equivalents (a literal stays a
   literal, so screens that deliberately paint dark in both themes, such as
   Onboarding, keep doing so). Old ember literals and tints move to the new
   orange. Excluded on purpose: the avatar art (`src/components/avatar/`), the
   brand mark (`src/lib/brand.js`, `src/components/brand/`) and third-party
   brand colors (Strava, Garmin and similar).
4. **Avatar contrast gate.** `scripts/check-avatar-contrast.mjs` tests the rigs
   against the grounds they render on. Those grounds change, so the gate's
   ground table changes with them, and the gate must pass.
5. **Signature moments**, the parts of Ignition that are more than a recolor:
   - primary buttons use the action gradient;
   - the Home hero puts the avatar inside a progress ring, with the XP left to
     the next rank as the single large number;
   - the workout-completion screen counts the XP up in gold, and the gained
     segment grows on the rank bar;
   - the leaderboard shows the top three on a podium and pins your own row;
   - Coach G's bubbles use the action gradient for the user and a plain
     surface for the coach;
   - the bottom navigation marks the active tab in orange.
6. **Documentation.** `CLAUDE.md` design-system section.

### Site (`gamefit-web`)

1. **Tokens and type.** `src/styles/tokens.css` and `global.css`: the same
   palette, Poppins self-hosted through `@fontsource` (the CSP and GDPR posture
   stay unchanged), headings in sentence case instead of expanded capitals.
2. **Buttons and hero.** The action gradient on primary calls to action, and
   the hero rebuilt around the progress ring and a rendered avatar.
3. **Screenshots.** `public/screens/*.webp` are regenerated from the redesigned
   app with `scripts/capture-screens.mjs`, or the site shows the old navy app.
4. **Documentation.** `DESIGN.md`.

## Verification gates

Nothing merges to `main` until every gate for that repository passes.

| Gate | App | Site |
|---|---|---|
| Lint / type check | `npm run lint` | `npm run check` |
| Emoji guard | `npm run check:emoji` | n/a |
| Avatar contrast | `npm run check:avatar` | n/a |
| Build | `npm run build` | `npm run build` |
| End-to-end | `npm run test:e2e` (88 tests, Chrome and WebKit) | `npm test` (Playwright, including axe on every route) |
| Rendered contrast | axe color-contrast scan of signed-in screens | covered by the axe suite |
| Visual review | Screenshots of each changed screen in both themes | Screenshot of the hero at desktop and phone width |
| Dependencies | `npm audit` stays at 0 | `npm audit` |

## Release

1. Both branches are pushed and opened as pull requests. The app's CI (lint,
   guards, build, audit, both browsers) runs on the pull request.
2. **Merging is the owner's call.** Merging to `main` deploys to production on
   Vercel immediately, so it happens only after the owner has looked at the
   pull requests.
3. After merging, the deploy is confirmed from the GitHub deployments API and a
   cache-missed request, not from the edge cache (see `CLAUDE.md`, "Edge cache
   can make a deploy look like it failed").

## Rollback

Each repository merges with `--no-ff`, so the whole redesign is one merge
commit. `git revert -m 1 <merge-sha>` followed by a push restores the previous
design, and Vercel redeploys it. No data, schema or API change is involved, so
a rollback carries no migration risk.

## Risks

| Risk | Mitigation |
|---|---|
| Red reads as "error" | Errors keep the coral `#E5614A` and an icon; the action gradient is never used for a destructive action. |
| Contrast regressions on the new grounds | Token ratios are recorded in `index.css`; the avatar gate and the axe scans are gates, not advice. |
| Avatar palettes were tuned on navy | The avatar gate re-runs against charcoal. Charcoal is neutral and close in lightness to navy, so the existing contour rule should hold. |
| The light theme was not in the mockups | Derived palette, checked by the same scans; flagged for the owner to review on a phone. |
| Site screenshots and store screenshots show the old app | Regenerated in this change where the scripts can run; otherwise listed below. |
| Native splash stays navy | Resolved: regenerated on charcoal with the husky recolor. |

## Follow-ups (owner decisions, not in this change)

1. ~~Recolor the husky mark to Ignition.~~ Done 2026-09-24: the owner chose
   option B (orange fur `#FF6B00`, charcoal linework and frame) from three
   mockups on the design canvas. `brand/`, the favicons, the OG image and the
   native icons were regenerated; the Hub71 deck is the owner's to update.
2. ~~Regenerate the native splash and icon backgrounds.~~ Done with the husky:
   `npx @capacitor/assets@3 generate` with `#141416` on all four background
   flags; `capacitor.config.ts` follows.
3. ~~Regenerate `store-assets/`.~~ Done in the redesign.
4. Real-phone review of the light theme.
