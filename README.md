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
