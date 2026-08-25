# GameFit Security Audit — 2026-08-25

Full-stack review of **both** surfaces:

- **App** — `D:\GameFit Claude-Base44` (Vite/React SPA, Supabase Postgres +
  RLS, 6 Deno Edge Functions, Stripe, Anthropic). Live at
  `gamefit-app.vercel.app`.
- **Marketing site** — `D:\gamefit-web` (Astro static, Web3Forms, no backend).
  Live at `gamefit-web.vercel.app`.

Method: source review of every auth/payment/user-data path, the DB security
model (RLS + column grants + RPCs + storage), both `vercel.json` header sets,
git-history secret scan, `npm audit`, and live checks against production
(headers, source-map exposure, captcha state). Structured against the two
audit prompts and all 54 checklist items from the three screenshots.

## Headline

The **database and Edge-Function layer is genuinely strong** — server-authoritative
economy, RLS on every table, column-level write grants that block mass
assignment, `search_path` on every `SECURITY DEFINER` function, signature-verified
Stripe webhook, service-only Strava tokens, race-safe AI credit cap. `npm audit`
is **0/0** in both repos. No secrets in code or git history. No SQL injection, no
XSS sink reachable by user/AI input, no IDOR.

The gaps are all at the **edges of the HTTP/config/ops layer**, and most are
**owner dashboard toggles**, not code. Nothing is Critical.

## Status after the remediation pass (same day)

Every code-level finding is now **fixed, deployed and verified in production**.
What remains is four owner dashboard actions and one product decision.

| # | Finding | Status |
|---|---|---|
| 1 | Turnstile captcha off | **OPEN — owner**, re-confirmed off today |
| 2 | Strava OAuth CSRF | **FIXED**, merged + deployed + verified live |
| 3 | App CSP report-only | **FIXED**, enforced and confirmed on the live header |
| 4 | Leaked-password protection off | **OPEN — owner** |
| 5 | Premium AI uncapped | **FIXED**, merged + deployed + verified live |
| 6 | QA account active | **OPEN — owner**, pre-launch |
| 7 | Web3Forms domain lock | **OPEN — owner** |
| 10 | Incomplete photo erasure (new) | **FIXED**, merged + deployed + verified |
| 11 | COOP missing on site (new) | **FIXED**, merged + deployed + verified |
| 12 | No re-auth on deletion (new) | **OPEN — product decision, see below** |

Claims in the "verified clean" table below were **re-tested against production**
rather than re-read: privilege escalation (`role`, `total_xp`, `account_type`,
`current_streak`, `stripe_subscription_id` all rejected `42501`, with a control
write returning 204 to prove the test discriminates), cross-user profile reads
(`Content-Range: 0-0/1` against the whole table), and `strava_connections`
(403, invisible to `authenticated`).

### 10. MEDIUM — Account deletion erased only the first 100 meal photos — FIXED

- **Where:** `supabase/functions/delete-account/index.ts`.
- **Problem:** the storage cleanup called `list()` once with `limit: 100`. That
  is the API's default **page size, not a total**, so any user with more photos
  than that kept the remainder. Storage objects do **not** cascade from
  `auth.users` — only the Postgres rows do — so everything missed survives the
  deleted account permanently as orphaned personal data. Meal photos accumulate
  one per analysis with no other cleanup path in the app, and a premium account
  can analyse up to 30 meals a day, so 100 is crossed in under a week.
- **Why it matters:** this is a **GDPR Art. 17 / UAE PDPL erasure failure**, not
  untidiness — a user exercises their right to be forgotten and their food
  photos remain in the bucket. Not an access-control hole: the leftovers are
  orphaned and still RLS-protected.
- **Fix (applied):** page until the folder is empty. The offset deliberately
  stays at `0` — each iteration deletes the page it just listed, so the window
  shifts down rather than the cursor moving up; advancing the offset would skip
  every second page. **Verified against live storage** with 105 objects in the
  QA account's own folder: removed 105 across 2 pages, 0 remaining. With the
  offset advancing, the second page would have come back empty and left 5.

### 11. LOW — Marketing site had no `Cross-Origin-Opener-Policy` — FIXED

- **Where:** `gamefit-web/vercel.json`.
- **Problem:** the app has set `COOP: same-origin` since phase 7; the site never
  did. Nothing made the site exempt — the two surfaces get scanned as one — so
  it was an oversight rather than a decision.
- **Fix (applied):** header added and asserted in `tests/csp.spec.ts` so it
  cannot regress silently. 15/15 security tests pass; confirmed live on a cache
  MISS. Zero risk: the site has no popups, OAuth window, or cross-origin
  embedding, which are the only things COOP can break.

### 12. LOW — Account deletion requires no re-authentication (product decision)

- **Where:** `supabase/functions/delete-account/index.ts` + `Profile.jsx`.
- **Problem:** the only control on a permanent, irreversible deletion is
  possession of a valid session. The `confirm: 'DELETE'` string is **not** a
  security control — it is a client-supplied constant any caller trivially
  includes. Someone with transient access to an unlocked device, or a stolen
  session token, can destroy the account outright.
- **Why it is not just fixed:** the standard remedy (re-enter your password) is
  a UX change to a destructive flow **and** needs a second branch for Google
  OAuth users, who have no password at all. That is a product call, not a
  purely technical one, so it is flagged rather than decided unilaterally.
- **Recommendation:** worth adding before public launch. Bounded impact today
  (an attacker with a live session can already read everything), but deletion
  is the one action with no undo.

---

## Findings, ranked by severity

### 1. MEDIUM — Turnstile captcha is OFF in production (owner action)

- **Where:** Supabase dashboard → Auth → Attack Protection. The client is
  fully wired (`src/components/Turnstile.jsx`, `Login.jsx`, `Register.jsx`,
  `ForgotPassword.jsx`) **and deployed**, but the server-side toggle is off.
- **Proof:** a junk-credential login against the live project returns
  `invalid_credentials`, not `captcha protection: request disallowed` — the
  documented tell for "captcha off."
- **Exploit:** the `/signup`, `/token`, `/recover`, `/resend` auth endpoints
  have no bot protection beyond Supabase's platform rate limits. Enables
  automated fake signups, credential-stuffing against `/token`, and
  password-reset email-bombing of arbitrary addresses.
- **Fix:** enable Turnstile in the dashboard. **Safe to do now** — the frontend
  that attaches tokens is already live, so enforcement won't lock anyone out.
  (Doing it the other way around — toggle before deploy — is what breaks logins;
  that ordering risk is already past.)
- **Effort:** 5 minutes.

### 2. MEDIUM — Strava OAuth had no CSRF `state` — FIXED

- **Where:** `supabase/functions/strava-auth/index.ts` (authorize) +
  `src/pages/StravaCallback.jsx`.
- **Exploit:** the authorize URL carried no `state` and the callback exchanged
  any `code` it received, binding it to the logged-in user server-side. An
  attacker could run Strava consent with **their own** account, capture the
  `code`, and send a victim a link to
  `…/strava/callback?code=ATTACKER_CODE`. A logged-in victim who clicks it gets
  the attacker's Strava account bound to their GameFit profile (OAuth
  account-linking CSRF). Impact is bounded — Strava here is read-only activity
  display, no economy/XP — but it is a real OAuth misconfiguration (checklist
  #54).
- **Fix (applied, branch `security/strava-oauth-state`):** mint a
  `crypto.randomUUID()` state server-side, return it, stash it in
  `sessionStorage` before redirect, and refuse to exchange a code whose echoed
  state doesn't match. Google OAuth is unaffected (Supabase handles PKCE/state
  internally). Lint clean, production build verified.
- **Status:** committed to a branch, **not merged** — review and merge at your
  discretion. Note: also add the exact Strava redirect URI to the Strava app
  settings if not already; no other config change needed.

### 3. MEDIUM — App CSP is Report-Only *and* has no report endpoint

- **Where:** `vercel.json:8` (app) — header is `Content-Security-Policy-Report-Only`.
- **Exploit:** the CSP is the last line of defence if an XSS payload ever slips
  past React's escaping. In report-only mode it **blocks nothing**. Worse,
  there is no `report-uri`/`report-to` directive, so it also **collects
  nothing** — the "watch the reports first" plan can't actually run. Right now
  the header is pure overhead with zero protective value.
- **Fix:** enforce it — rename the header key to `Content-Security-Policy`.
  Risk of breakage is **low**: `script-src` is already `'self'` +
  `challenges.cloudflare.com` with no `'unsafe-inline'`/`'unsafe-eval'`, and the
  only inline scripts in `index.html` are an external `main.jsx`, an external
  `sw-register.js` (both `'self'`), and a `<script type="application/ld+json">`
  data block (not executed as JS, so modern browsers don't gate it on
  `script-src`). One caveat worth a 2-minute check after flipping: confirm the
  JSON-LD block and Turnstile widget still load in Chrome + Safari.
- **Effort:** 5 min + a smoke test. I can apply this on request.

### 4. LOW — "Leaked password protection" disabled (owner action)

- **Where:** Supabase dashboard → Auth → Password security.
- **Exploit:** users can set passwords known to be in the HaveIBeenPwned breach
  corpus, making credential-stuffing (see #1) far more likely to succeed.
- **Fix:** one toggle. Client already enforces an 8-char minimum
  (`ResetPassword.jsx:35`); this adds breach-corpus checking on top.

### 5. LOW — Premium AI is uncapped; Edge Functions have no app-level rate limit

- **Where:** `supabase/functions/coach-g/index.ts` (premium path skips
  `consume_ai_credit`); `create-checkout`, `strava-auth`, `delete-account` have
  no per-user throttle.
- **Exploit:** the **free** tier is capped and race-safe (10/mo via
  `consume_ai_credit` + advisory lock — this part is excellent). But a
  **premium** account (AED 29.99/mo) has *unlimited* Coach G + meal-photo
  analysis, so one abusive or compromised premium user can run unbounded
  Anthropic + storage cost. The other functions can be called in a loop by any
  authenticated user (Stripe/Supabase platform limits are the only backstop).
- **Fix:** add a generous per-user daily ceiling even for premium (e.g. ~100
  chat + ~30 meal-analysis/day) reusing the `consume_ai_credit` pattern with a
  higher limit; optionally a lightweight per-user throttle on the other
  functions. Not urgent pre-launch, but a real cost-abuse vector at scale.
- **Effort:** 1–2 hours.

### 6. LOW — QA test account still active (owner action, pre-launch)

- **Where:** `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env.local`
  (gitignored, local + CI-secret only — **not** exposed) and the corresponding
  Supabase user.
- **Exploit:** minimal — credentials aren't public. But a known live account
  with a known password is an unnecessary standing target and pollutes the
  leaderboard.
- **Fix:** delete the account + its rows before public launch (already on the
  `LAUNCH_CHECKLIST`).

### 7. INFO — Web3Forms key protection depends on a dashboard setting

- **Where:** `gamefit-web`, `PUBLIC_WEB3FORMS_KEY` (ships in the bundle by
  design).
- **Note:** the key is public on purpose; its only protection is the
  **domain-restriction** setting in the Web3Forms dashboard. Confirm that's set
  to the production domain before launch, or the key can be driven from any
  origin to send mail through your form.

### 8. INFO — JSON-LD uses `set:html` with static content (site)

- **Where:** `src/components/Head.astro:42`, `src/sections/Faq.astro:56`.
- **Note:** `set:html={JSON.stringify(...)}` is safe **today** because the
  input is developer-controlled constants. If any user/dynamic content is ever
  fed in, a `</script>` inside it could break out of the block. If that day
  comes, escape `<` → `\u003c`. No action needed now.

### 9. INFO — No client-side size pre-check on meal-photo upload

- **Where:** `src/components/gamefit/NutritionTab.jsx:288`.
- **Note:** not a security hole — the bucket enforces 5 MB + an image MIME
  allowlist server-side (`20260815120001_harden_uploads_and_ai_cap.sql`), and
  SVG is excluded so the SVG-XSS vector is closed. Purely a UX nicety (fail
  fast before uploading). Optional.

---

## What was verified clean (so it isn't re-audited)

| Area | Evidence |
|---|---|
| **Secrets in code / git / JS bundle** | Only `.env.example` templates tracked; history scan across both repos found only doc references to variable names, no values; `dist/assets` has no `service_role`/`sk-*` key; no `VITE_`-prefixed server secret. |
| **SQL injection** | All DB access via parameterized PostgREST + `SECURITY DEFINER` RPCs; no string-built SQL. |
| **XSS** | No reachable sink. Coach G output rendered via `react-markdown` with **no** `rehype-raw` (raw HTML escaped), chart values coerced to `Number`/`String`, links get `rel="noopener noreferrer"` + built-in URL sanitization. The two `dangerouslySetInnerHTML`/`set:html` uses take only developer-controlled data. |
| **Mass assignment / privilege escalation** | `profiles` UPDATE grant whitelists only user-editable columns; `role`, `account_type`, `total_xp`, coins, streaks, stripe IDs are **not** grantable → a crafted `updateProfile({role:'admin'})` is rejected server-side. |
| **IDOR / cross-user access** | RLS `= auth.uid()` on every table; RPCs derive the user from `auth.uid()`, never from a client param; storage scoped to `<uid>/`; leaderboard RPC returns PII-trimmed rows only. |
| **AuthZ on admin route** | `/admin` gated by `AdminRoute` (`role === 'admin'`); the page itself is 100% mock data with **zero** server calls, so bypassing the client guard yields nothing. `X-Robots-Tag: noindex` set. |
| **Payments** | Webhook signature-verified (`constructEventAsync`); premium bound by `client_reference_id`, never payer email; premium re-verified against Stripe server-side (`verifyPremium`); prices discovered from Stripe, never trusted from client. |
| **Password reset** | Silent success (no user enumeration), recovery-session based (no token parsed from URL), sign-out after change. |
| **Broken redirects / open redirect** | Checkout & OAuth redirects locked to an origin allowlist (`resolveAllowedOrigin`). |
| **CORS** | Edge Functions use an origin allowlist (`withCors`) incl. the Capacitor origins; `stripe-webhook` has no CORS by design. |
| **Dependency CVEs** | `npm audit` = 0 vulnerabilities, both repos. |
| **Source maps** | Not built (`sourcemap:false`) and 403 on both live sites. |
| **Security headers** | Both sites: HSTS (preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. Site CSP is **fully enforced** with per-script hashes (gold standard). App CSP present but report-only — see #3. |
| **Error/log hygiene** | Edge Functions log status codes and messages, never response bodies or secrets; generic user-facing errors. |

---

## 54-item checklist mapping

**Part 1 (1–18):** 1 DB creds server-only ✓ · 2 no public `.env` ✓ · 3 no
hardcoded secrets ✓ · 4 auth = Supabase + captcha(needs toggle #1) · 5 authz
via RLS/grants ✓ · 6 no cross-user access ✓ · 7 grants locked down ✓ · 8 storage
bucket private + limited ✓ · 9 admin route gated + mock-only ✓ · 10 no prod
debug tools ✓ · 11 logs don't leak secrets ✓ · 12 generic prod errors ✓ · 13 no
secrets in git ✓ · 14 no secrets in JS bundle ✓ · 15 server-authoritative, not
client-only ✓ · 16 zod + DB CHECK validation ✓ · 17 no SQLi ✓ · 18 n/a (no
NoSQL).

**Part 2 (19–36):** 19 XSS none ✓ · 20 CSRF — OAuth state **fixed #2**; state-changing
ops are authenticated RPCs with bearer tokens (not cookies) so classic form-CSRF
doesn't apply · 21 uploads limited ✓ · 22 no path traversal (folder-scoped +
filename sanitized) ✓ · 23 no SSRF (no user-supplied URLs fetched) ✓ · 24
password reset sound ✓ · 25 sessions = Supabase JWT ✓ · 26 JWT secret is
Supabase-managed ✓ · 27 CORS allowlisted ✓ · 28 rate limits — free AI capped ✓,
premium/other **#5** · 29 no exposed env ✓ · 30 no default creds (QA acct **#6**)
· 31 webhook signed ✓ · 32 payments server-verified ✓ · 33 no IDOR/BOLA ✓ · 34
API input validated ✓ · 35 logs clean ✓ · 36 source maps not exposed ✓.

**Part 3 (37–54):** 37 deps 0 CVEs ✓ · 38 no malicious pkgs (14 unused removed
in phase 7) ✓ · 39 prompt-injection sanitized (`sanitizeForPrompt`) ✓ · 40 AI
server-side only, key never client ✓ · 41 least-privilege grants ✓ · 42 append-only
coin ledger + ai_request_logs (partial audit trail) ✓ · 43 monitoring =
Sentry/PostHog (needs keys, owner) · 44 backups = Supabase managed (Pro/PITR is
an owner decision) · 45 no exposed internal dashboards ✓ · 46 headers set; app
CSP **#3** · 47 cookies — n/a (token auth, not cookies) · 48 data encrypted in
transit (HSTS/TLS) + at rest (Supabase) ✓ · 49 single-tenant per-user isolation
via RLS ✓ · 50 code reviewed here ✓ · 51 mass assignment blocked ✓ · 52 no
command injection ✓ · 53 no unsafe deserialization ✓ · 54 OAuth **fixed #2**;
enable captcha **#1**.

---

## Recommended order of action

Items 2, 3, 5, 10 and 11 are **done** — merged, deployed and verified in
production. What is left:

1. **Now (owner, 10 min, zero code):** enable Turnstile (#1) and leaked-password
   protection (#4) in the Supabase dashboard → Auth. Turnstile is **safe to
   enable now** — the frontend that attaches tokens has been live since phase 8,
   so enforcement locks nobody out. The dangerous ordering (toggle before
   deploy) is already past.
2. **Pre-launch (owner):** confirm the Web3Forms **domain restriction** (#7) is
   set to the production domain — that setting is the only thing protecting the
   public form key — and delete the QA account (#6).
3. **Decide (#12):** whether account deletion should require re-authentication.
   Recommended before public launch; needs a path for Google-OAuth users.

Nothing outstanding is Critical, and no outstanding item is code.

## How the fixes were verified

Deploys, not just commits — CLAUDE.md's warning that Vercel cache headers lie
about deploy state applies here, so deployment state came from the GitHub
deployments API and content from cache-MISS responses.

| Fix | Verification |
|---|---|
| Strava OAuth state (#2) | Live function returns a UUID `state` present in the authorize URL; client refuses a mismatched echo. |
| Premium AI cap (#5) | Against production: invalid type → 400 and **zero** ledger rows; empty chat → 400 and zero rows; real chat → 200 writing exactly one row to `day:2026-08-25:text`, confirming the premium path ran. |
| Photo erasure (#10) | 105 objects uploaded to the QA account's own folder; loop removed 105 across 2 pages, 0 remaining. |
| Site COOP (#11) | 15/15 security tests under the real policy; live header confirmed on `X-Vercel-Cache: MISS`. |
| No regressions | `npm run verify` (lint + emoji + avatar contrast + build + e2e): **97 passed, 11 skipped**. `npm audit` 0 in both repos. |
| Deploys landed | GitHub deployments API `state: success`, SHA matching local HEAD on both repos. |
