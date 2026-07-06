# One-time platform setup (Checkpoint A)

These are the accounts and keys only you (the owner) can create. Total time:
about 10–15 minutes. After this, Claude Code can build and deploy everything else.

## 1. GitHub — create the new repository (~2 min)

1. Go to https://github.com/new
2. Repository name: **gamefit-app** · Visibility: **Private**
3. Do NOT initialize with a README (the local repo already has commits).
4. Click **Create repository**, then copy the HTTPS URL
   (`https://github.com/muhammet-tm/gamefit-app.git`).

Optional but recommended (lets Claude Code open PRs for you):
install GitHub CLI from https://cli.github.com, then run `gh auth login`
in a terminal and follow the browser prompt.

## 2. Supabase — create the project (~5 min)

1. Go to https://supabase.com → Sign up / log in (GitHub login is fine).
2. **New project**:
   - Organization: your personal org
   - Name: **gamefit**
   - Database password: generate a strong one and SAVE it in a password manager
   - Region: **West EU (Frankfurt)** or the closest available to the UAE
   - Plan: Free
3. When it finishes provisioning, go to **Project Settings → API** and copy:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon / public key** (long string starting `eyJ...` — this one is safe for browsers)
4. Create `.env.local` in the project folder (`D:\GameFit Claude-Base44`) by
   copying `.env.example` and pasting those two values in.

## 3. Supabase — server secrets (~3 min)

In the Supabase dashboard: **Edge Functions → Secrets** (or Project Settings →
Edge Functions). Add these, with the values from your Base44 dashboard /
Anthropic console / Stripe dashboard (same keys the old app uses):

| Secret name | Where to find the value |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys (use the **test** key for now) |
| `STRIPE_WEBHOOK_SECRET` | leave for Checkpoint C — created when we register the new webhook |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | strava.com/settings/api |
| `RESEND_API_KEY` | leave for later — created at resend.com when we wire emails |

Never paste these into chat or into any file in the repo.

## 4. Vercel — create the project (~3 min)

1. Go to https://vercel.com → sign up with your GitHub account.
2. **Add New → Project** → import **gamefit-app**.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output `dist` (defaults are correct).
4. Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (same values as your `.env.local`).
5. Deploy. The build may show a warning until Phase 1 lands — that's fine.
6. Plan note: the free Hobby plan is fine for previews during development.
   Before real customers arrive, upgrade to **Pro ($20/mo)** — Vercel's Hobby
   terms don't allow commercial use.

## When you're done

Tell Claude Code "checkpoint A done". Have ready:
- The GitHub repo URL
- `.env.local` filled in (Claude reads the values from the file, not from chat)
