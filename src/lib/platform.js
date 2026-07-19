// Platform detection + native-shell behaviors for the App Store / Play builds.
//
// Store compliance model (v1):
//   - Purchases: Apple 3.1.1 and Google Play's billing policy require their
//     own in-app purchase systems for digital subscriptions bought *inside*
//     the native apps. GameFit v1 therefore HIDES all purchase UI on native
//     builds (the compliant "reader" pattern — Netflix/Spotify model).
//     Subscribing happens on the web; premium unlocks everywhere via login.
//     The native apps must NOT link out to the purchase page.
//   - OAuth: Google blocks sign-in inside embedded webviews, so native builds
//     open the system browser and return via the gamefit:// deep link.
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/api/supabase';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'

/** True when purchase/upgrade UI must be hidden (store billing rules). */
export const hidePurchases = isNative;

/**
 * Google sign-in that works everywhere:
 * web → normal redirect; native → system browser + deep-link return.
 */
export async function signInWithGoogle() {
  if (!isNative) {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  const { Browser } = await import('@capacitor/browser');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'online.gamefit.app://auth-callback',
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  await Browser.open({ url: data.url, windowName: '_self' });
}

/**
 * Native bootstrap: listen for the OAuth deep link, exchange the code for a
 * session, style the status bar, and hide the splash once mounted.
 * Call once from main.jsx; a no-op on the web.
 */
export async function initNativeShell() {
  if (!isNative) return;

  const [{ App }, { Browser }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/browser'),
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
  ]);

  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url?.startsWith('online.gamefit.app://auth-callback')) return;
    try {
      await Browser.close().catch(() => {});
      const params = new URL(url.replace('online.gamefit.app://', 'https://gamefit.online/')).searchParams;
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('OAuth deep-link handling failed:', e);
    }
  });

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === 'android') await StatusBar.setBackgroundColor({ color: '#0D0F14' });
  } catch { /* status bar not critical */ }

  setTimeout(() => SplashScreen.hide().catch(() => {}), 400);
}
