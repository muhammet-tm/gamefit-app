# GameFit — App Store & Google Play Submission Guide

Everything the code side already handles, and the exact steps only you (the
account owner) can do. Written 19 July 2026 against the current store rules.

## What the codebase already complies with

| Requirement | Status |
|---|---|
| Native shells (Capacitor 7) for iOS + Android | ✅ `ios/` and `android/` folders, appId `online.gamefit.app` |
| Not a "website mirror" (Apple 4.2 / Play webview policy) | ✅ full interactive app: game economy, AI coach, offline-capable shell |
| In-app purchases policy (Apple 3.1.1 / Play billing) | ✅ native builds **hide all purchase UI** ("reader" pattern — like Netflix). Subscriptions happen on the web; premium unlocks in-app via login. The apps never link to the purchase page. |
| In-app account deletion (Apple 5.1.1(v) / Play policy) | ✅ Profile → Delete Account calls the `delete-account` function: cancels Stripe subscription, wipes all data, removes login |
| Web deletion resource (Play Data-safety requirement) | ✅ https://gamefit.online/delete-account |
| Privacy Policy + Terms URLs | ✅ https://gamefit.online/privacy and /terms (drafts — get legal review) |
| Google OAuth outside embedded webviews | ✅ native builds open the system browser and return via the `online.gamefit.app://` deep link (registered in AndroidManifest + Info.plist) |
| App icons & splash screens | ✅ generated for both platforms from `resources/` (re-run `npx capacitor-assets generate`) |
| Store screenshots | ✅ `store-assets/appstore/` (1290×2796) and `store-assets/play/` (1080×1920) |
| Target API (Play: API 36 from 31 Aug 2026) | ✅ Capacitor 7 targets current Android APIs; keep `npx npm update @capacitor/android` before submission |

## Costs you cannot avoid (platform fees)

- **Apple Developer Program: USD 99/year** — developer.apple.com/programs
- **Google Play Console: USD 25 one-time** — play.google.com/console/signup

## Building the Android app (on your Windows PC)

1. Install Android Studio (free): https://developer.android.com/studio
2. Open the `android/` folder in it and let it sync.
3. Create your signing key once: **Build → Generate Signed Bundle → Create new keystore**. SAVE the keystore file + passwords in your password manager — losing them means you can never update the app.
4. Build → Generate Signed Bundle (AAB) → upload the `.aab` in Play Console.

Each time the web app changes: `npm run build && npx cap sync android` then rebuild.

## Building the iOS app (requires a Mac — you're on Windows)

Recommended: **Codemagic** (codemagic.io) free tier — 500 macOS build minutes/month.
1. Sign up with GitHub, add the `gamefit-app` repo.
2. Use their Capacitor workflow; connect your Apple Developer account for signing.
3. It produces a signed `.ipa` and can upload straight to App Store Connect.
Alternative: any physical Mac with Xcode (open `ios/App/App.xcworkspace`).

## App Store Connect — listing answers

- Category: Health & Fitness. Secondary: Lifestyle.
- Age rating questionnaire → results in **12+** (unrestricted web access: NO; the app has no user-generated public content besides leaderboard display names).
- App Privacy (nutrition labels) — declare, all "linked to you":
  - Contact info: email address (app functionality)
  - Health & fitness: fitness data — workouts, weight, height (app functionality)
  - User content: photos (only if user uses meal snap), other content (coach messages)
  - Identifiers: user ID (app functionality)
  - Purchases: purchase history (subscription status)
  - Usage data: product interaction (analytics)
  - No tracking across apps ("Tracking": none) — keep PostHog first-party only.
- Review notes: provide the demo login (create a fresh reviewer account, e.g.
  reviewer@gamefit.online with a strong password) and note: "Premium is
  purchasable only on our website; the app does not sell or link to external
  purchases, per guideline 3.1.3(a)."

## Play Console — listing answers

- App category: Health & Fitness. Content rating questionnaire → Everyone/Teen.
- Data safety form: mirrors the Apple list above; deletion URL:
  https://gamefit.online/delete-account
- Store listing: use `store-assets/play/` screenshots + a 1024×500 feature
  graphic (ask Claude to generate it from the brand kit when you're ready).
- Countries: start with UAE + GCC, expand later.

## Pre-submission checklist

1. [ ] Legal pages reviewed by a lawyer (currently marked DRAFT).
2. [ ] Switch Stripe to live mode (see LAUNCH_CHECKLIST.md) — the web must be
       selling for real before store apps that rely on web subscriptions.
3. [ ] Point gamefit.online at Vercel so the in-app legal/deletion URLs are live
       on the real domain.
4. [ ] Add `online.gamefit.app://auth-callback` to Supabase → Authentication →
       URL Configuration → Redirect URLs (required for native Google login).
5. [ ] Create the reviewer demo account.
6. [ ] Build, install on a real Android phone, run the full QA pass.
7. [ ] Submit Android first (faster review), iOS second.
