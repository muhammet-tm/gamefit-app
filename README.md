# GameFit

AI-powered gamified fitness app — workouts become an RPG progression:
XP, ranks, streaks, an evolving avatar, an AI coach, and a rewards shop.

- **Live app:** https://gamefit.online
- **Marketing site:** https://gamefit.me
- **Architecture & migration status:** see [ARCHITECTURE.md](ARCHITECTURE.md)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint check |
| `npm run typecheck` | Type check |

## Stack

Vite + React 18 · Tailwind + Radix/shadcn · Supabase (Postgres/Auth/Edge Functions) · Stripe · Anthropic Claude · Vercel
