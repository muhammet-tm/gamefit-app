// Service worker registration.
//
// This lives in its own file rather than inline in index.html so the app can
// ship `script-src 'self'` with no hashes and no nonces. An inline <script>
// would force either 'unsafe-inline' (which defeats the policy) or a sha256
// hash that has to be regenerated every time this code changes.
//
// Network-first navigations, so a new deploy is never pinned by an old cache.
// Skipped inside the native Capacitor shells, which serve from the bundle.
if ('serviceWorker' in navigator && !window.Capacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
