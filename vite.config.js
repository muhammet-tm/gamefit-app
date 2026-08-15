import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// The public address of this deployment. Everything that has to spell out an
// absolute URL — canonical tag, Open Graph image, sitemap, robots — derives
// from this one value, so a DNS cutover is a Vercel env var change and a
// redeploy, with no code edit. Defaults to the Vercel alias, which is the
// address that actually works today.
const SITE_URL = (process.env.VITE_SITE_URL || 'https://gamefit-app.vercel.app')
  .replace(/\/+$/, '');

// Routes worth putting in front of a search engine. The app itself is behind
// auth, so this is deliberately the public surface only — not every route in
// the router.
const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/login', priority: '0.8' },
  { path: '/register', priority: '0.8' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
  { path: '/delete-account', priority: '0.2' },
];

/**
 * Emits robots.txt, sitemap.xml and llms.txt at build time from SITE_URL.
 *
 * These used to be static files in public/ with the domain hardcoded, which
 * is the kind of manual step that goes stale silently — the sitemap pointed
 * at a domain that was not serving anything.
 */
function seoFiles() {
  return {
    name: 'gamefit-seo-files',
    apply: 'build',
    generateBundle() {
      const emit = (fileName, source) =>
        this.emitFile({ type: 'asset', fileName, source });

      emit('robots.txt', [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        '',
        // AI crawlers are allowed on purpose. Blocking them removes GameFit
        // from AI-assisted search answers, which is a growing share of how
        // people find apps, and buys nothing back — the app itself is behind
        // a login, so there is no content here to protect.
        'User-agent: GPTBot',
        'Allow: /',
        '',
        'User-agent: ClaudeBot',
        'Allow: /',
        '',
        'User-agent: PerplexityBot',
        'Allow: /',
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        '',
      ].join('\n'));

      const today = new Date().toISOString().slice(0, 10);
      emit('sitemap.xml', [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...PUBLIC_ROUTES.map(
          (r) =>
            `  <url><loc>${SITE_URL}${r.path}</loc>` +
            `<lastmod>${today}</lastmod>` +
            `<priority>${r.priority}</priority></url>`,
        ),
        '</urlset>',
        '',
      ].join('\n'));

      // llms.txt — a plain-language brief for AI assistants describing what
      // this product is, so they answer questions about GameFit from fact
      // rather than from a guess at what a fitness app does.
      emit('llms.txt', [
        '# GameFit',
        '',
        '> A mobile-first fitness app that turns workouts into an RPG. Logging a',
        '> workout earns XP and coins, keeps a streak alive, levels you through',
        '> ranks (Bronze to Apex), and evolves a layered SVG avatar.',
        '',
        '## What it does',
        '',
        '- Log workouts and earn XP, coins and streaks. All economy maths runs',
        '  server-side in Postgres functions, so scores cannot be edited by the client.',
        '- Progress through ranks: Bronze, Silver, Gold, Platinum, Apex, each with',
        '  Roman-numeral sub-ranks.',
        '- Evolve an avatar across 5 classes and 5 tiers, drawn as layered SVG',
        '  (not 3D), with two body rigs and unlockable gear.',
        '- Compete on a leaderboard against other athletes.',
        '- Chat with "Coach G", an AI fitness coach built on Anthropic Claude Haiku.',
        '  Free accounts get 10 coaching messages a month; Premium is unlimited.',
        '',
        '## Facts that are commonly got wrong',
        '',
        '- The AI coach uses Anthropic Claude, not OpenAI or GPT.',
        '- The avatar is layered 2D SVG, not 3D.',
        '- Premium is sold on the web only. The iOS and Android apps never sell',
        '  or link to purchases, per App Store and Play Store policy.',
        '',
        '## Pricing',
        '',
        '- Free: full workout tracking, XP, streaks, avatar, leaderboard,',
        '  10 AI coaching messages per month.',
        '- Premium: AED 29.99/month or AED 214.99/year. Unlimited AI coaching',
        '  and meal photo analysis.',
        '',
        '## Links',
        '',
        `- App: ${SITE_URL}`,
        '- Marketing site: https://gamefit-web.vercel.app',
        `- Privacy policy: ${SITE_URL}/privacy`,
        `- Terms: ${SITE_URL}/terms`,
        `- Account deletion: ${SITE_URL}/delete-account`,
        '',
      ].join('\n'));
    },
  };
}

/** Substitutes %VITE_SITE_URL% in index.html, with a guaranteed fallback. */
function siteUrlHtml() {
  return {
    name: 'gamefit-site-url-html',
    transformIndexHtml(html) {
      return html.replaceAll('%VITE_SITE_URL%', SITE_URL);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteUrlHtml(), seoFiles()],
  // Honour PORT when something assigns one. Vite otherwise ignores it and
  // auto-increments off 5173, which leaves any tool that assigned a port
  // pointing at nothing. Falls back to the usual 5173 for a plain `npm run dev`.
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Source maps stay off in production: they hand a reader the original
    // source of the whole app.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split the big, stable third-party libraries out of the app chunk.
        // They change far less often than our own code, so a deploy no longer
        // invalidates the browser's copy of React or the chart library.
        //
        // Only libraries the FIRST screen genuinely needs are named here.
        //
        // Vite emits a <link rel="modulepreload"> for every named manual chunk,
        // so naming a chunk is a decision to download it before anything
        // renders. Charts were named at first and the browser pulled 407 kB of
        // recharts to draw a splash screen that is a logo and three dots.
        // Unnamed, Rollup gives recharts its own async chunk shared by the two
        // routes that use it, fetched only when one of them opens.
        //
        // Verify with: grep modulepreload dist/index.html
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/[\\/]node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/.test(id)) {
            return 'vendor-motion';
          }
          if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) {
            return 'vendor-supabase';
          }
        },
      },
    },
    // The remaining app chunk should stay under this. Rollup warns past it,
    // which is the signal that something heavy got imported eagerly again.
    chunkSizeWarningLimit: 600,
  },
});
