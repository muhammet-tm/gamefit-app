import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

/**
 * Cloudflare Turnstile widget.
 *
 * Supabase's captcha protection is enforced server-side on signUp,
 * signInWithPassword and resetPasswordForEmail. Once it is enabled, those
 * endpoints reject any request without a valid token — there is no per-platform
 * exemption — so every form that calls them has to render this.
 *
 * Two behaviours here are the difference between this working and this being a
 * support nightmare:
 *
 * 1. TOKENS ARE SINGLE USE. Supabase redeems the token when it verifies it.
 *    A second submit with the same token fails with "captcha protection:
 *    request disallowed". Any failed or completed attempt must call reset()
 *    before the user tries again, which is why this exposes an imperative
 *    handle rather than just firing a callback.
 *
 * 2. TOKENS EXPIRE (~5 minutes). Someone who opens the login page, wanders
 *    off, and comes back to submit would otherwise hit an unexplained
 *    failure. The `expired-callback` clears the token and re-runs the widget.
 */

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';

/**
 * The site key is public by design — it ships in the HTML of every page that
 * renders a widget, and on its own it proves nothing. Verification happens
 * server-side against the secret key, which lives only in Supabase.
 *
 * Overridable so the test suite can substitute Cloudflare's always-passes test
 * key without touching code.
 */
const SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAEQrGGiPI0XQLOCD';

let scriptPromise = null;

/** Loads the Turnstile script once, however many widgets mount. */
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow a retry on remount
      reject(new Error('Turnstile failed to load'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile({ onToken, onError, className = '' }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  // Mirrors token state onto the DOM. The E2E suite waits on this rather than
  // sleeping, because how long Cloudflare takes to resolve is not fixed and a
  // fixed wait would be flaky in one direction or slow in the other.
  const [ready, setReady] = useState(false);
  // Held in a ref so the callbacks registered with Turnstile always see the
  // current handler without the widget having to be torn down and rebuilt.
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  useImperativeHandle(ref, () => ({
    reset() {
      setReady(false);
      onTokenRef.current?.(null);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          /* widget already gone — nothing to reset */
        }
      }
    },
  }), []);

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'auto',
          // Managed mode: usually resolves silently, and only shows a real
          // challenge when the visitor looks automated.
          appearance: 'always',
          callback: (token) => {
            setReady(true);
            onTokenRef.current?.(token);
          },
          'expired-callback': () => {
            setReady(false);
            onTokenRef.current?.(null);
            if (widgetIdRef.current !== null) window.turnstile.reset(widgetIdRef.current);
          },
          'error-callback': () => {
            setReady(false);
            onTokenRef.current?.(null);
            onErrorRef.current?.();
          },
        });
      })
      .catch(() => {
        // Network blocked, an ad blocker, or Cloudflare down. Say so rather
        // than leaving a form that silently refuses to submit.
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* already removed */
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="turnstile"
      data-token-ready={ready ? 'true' : 'false'}
    />
  );
});

export default Turnstile;

/** True when captcha is expected to be enforced. Kept in one place so the
 *  forms and the tests agree on it. */
export const CAPTCHA_ENABLED =
  import.meta.env.VITE_TURNSTILE_DISABLED !== 'true';

export { SITE_KEY };
