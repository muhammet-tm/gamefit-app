// Vercel Web Analytics setup. Loaded before /_vercel/insights/script.js, and
// only in production builds on Vercel (see vercelAnalytics() in vite.config.js).
//
// It lives in its own file for the same reason as sw-register.js: the app
// ships `script-src 'self'` with no hashes, so an inline <script> would need
// either 'unsafe-inline' or a hash to maintain.
//
// The one job here is the beforeSend hook. Some URLs in this app carry
// secrets: the Strava callback arrives with ?code= and &state=, and auth links
// can carry tokens in the query or the fragment. The hook drops the query
// string and the fragment from every page view before it leaves the browser,
// so analytics only ever sees the path. An event whose URL cannot be parsed is
// dropped rather than sent as-is.
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

window.va('beforeSend', function (event) {
  try {
    var url = new URL(event.url);
    url.search = '';
    url.hash = '';
    return Object.assign({}, event, { url: url.toString() });
  } catch (e) {
    return null;
  }
});
