# Trading Log

A personal, mobile-friendly trading journal: log each trade in a few taps, then
review win rate, P&L trend, and R-multiple distribution to spot patterns.

- **Frontend**: React + Vite + TypeScript, deployed as a static site to GitHub Pages.
- **Data**: [Supabase](https://supabase.com) (Postgres) — every trade row is
  scoped to your user with row-level security (RLS), so even though the app's
  public "anon" key ships in the browser bundle, Postgres itself refuses to
  return or accept rows that aren't yours.
- **Auth**: Google sign-in via Supabase Auth.

## 1. Create the Supabase project

1. Create a free project at [supabase.com](https://supabase.com). (I'm not
   certain what the current free-tier limits are — check their pricing page,
   but a personal log of a trade or two a day is a tiny amount of data.)
2. In the SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql) to
   create the `trades` table and its RLS policies.
3. Under **Authentication → Sign In / Providers → Google**, enable the Google
   provider. You'll need a Google OAuth client ID/secret from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (OAuth consent screen + "Web application" credentials). Supabase's Google
   provider setup page shows you exactly which redirect URI to add to the
   Google client.
4. Under **Authentication → URL Configuration**, add your GitHub Pages URL
   (e.g. `https://<your-username>.github.io/trading/`) as a **Redirect URL**,
   and set it as the **Site URL**. Add `http://localhost:5173` too, for local dev.
5. Under **Project Settings → API**, copy the **Project URL** and **anon public**
   key — you'll need both below.

## 2. Local development

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
npm install
npm run dev
```

## 3. Deploy to GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) builds and deploys on
every push to `main`.

1. In the GitHub repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions** and add two repository
   secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as
   `.env.local`).
3. Push to `main` — the app will build and deploy to
   `https://<your-username>.github.io/trading/`.

If you rename the repository, update the `base` path in `vite.config.ts` to match.

## Notes on the data model

Each trade stores: date, time, symbol, direction (long/short), position size,
entry/exit price, stop loss, take profit, risk amount ($), fees, and realized
P&L ($). R-multiple (P&L ÷ risk) is computed in the app, not stored, so it's
always consistent with whatever you edit.

This is intentionally a small, personal-scope v1 — no shared/multi-user
features, no broker integration. Easy things to add later: trade notes/tags,
CSV export, editing an existing trade (currently: delete and re-log).
