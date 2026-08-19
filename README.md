# FastWorkParser

Personal job aggregator: pulls listings from multiple sources, filters
them by stack match and visa/authorization red flags, and notifies via
Telegram. See `TZ.md` for the full spec.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in the values in `.env`, then start the app:

```bash
npm run start:dev
```

## Scripts

```bash
npm test         # run unit tests
npm run build    # compile TypeScript
npm run lint     # run ESLint
```

The SQLite database file is created automatically at `DB_PATH`
(default `data/jobs.sqlite`).

## Deploy (Render)

Render's free tier only offers a *Web Service* instance for free — Background
Workers and Cron Jobs both require a paid plan. Since the pipeline is
internally cron-driven (`@nestjs/schedule`, no inbound traffic needed), it's
deployed as a free Web Service with a `GET /health` endpoint, kept awake by an
external pinger — a free Web Service spins down after 15 minutes without
HTTP traffic, which would stop the internal cron from ever firing.

1. In the Render dashboard, create a new Blueprint from this repo — it reads
   `render.yaml` and provisions the service. When prompted, fill in
   `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (marked `sync: false` in the
   blueprint, so they're never stored in the repo).
2. Once deployed, copy the service's `.onrender.com` URL and set it as a
   repository variable named `RENDER_APP_URL` (Settings → Secrets and
   variables → Actions → Variables). The `.github/workflows/keep-alive.yml`
   workflow pings `$RENDER_APP_URL/health` every 10 minutes to keep the
   instance from sleeping.

**Caveat:** free Web Services have an ephemeral filesystem — `data/jobs.sqlite`
(and its dedup history) is wiped on every redeploy or Render-initiated
container restart, not just on our own spin-downs. A wipe means the next
pipeline run may re-notify jobs that were already sent. This is an accepted
trade-off of staying on the free tier; moving dedup state to an external
database would remove it if it becomes a problem.
