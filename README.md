# PM Roadmap

A collaborative product manager roadmap board built with React, Tailwind CSS, and Lucide Icons.

## Features

- **Time horizons** — switch between Month, Quarter, and H1/H2 views; initiatives remap into the corresponding time buckets automatically.
- **PMs** — Steven, Jerel, Sijia, Timothy, and Kiva, each with a distinct color badge.
- **Customer journeys** — Learn & Decide, Buy, Post Purchase, Discovery, B2B, Used, Marketing, and Site Support.
- **Board view** — matrix layout grouped by journey (rows) x time bucket (columns), or a flat Kanban by time bucket.
- **Drag-and-drop** — drag cards between time buckets (and journeys, when grouped) to re-plan.
- **Filters & search** — multi-select PM and Journey filters, plus title/tag search, with a live "showing X of Y" indicator.
- **Add/Edit modal** — create or update an initiative's title, description, PM, journey, time bucket, status, progress, impact metric, and tags.
- **Dark/light mode** — dark-slate aesthetic by default, toggleable to light.
- **Persistence** — initiatives and PM avatar photos are saved to a Postgres database (see below); a "Saved" / "Local only" indicator in the header shows whether the database is reachable.

## Development

```bash
npm install
npm run dev
```

`npm run dev` runs the Vite dev server only, which can't serve the `/api/*` routes — the app will run in "Local only" mode (nothing persists). To exercise real persistence locally, use the Vercel CLI instead: `vercel dev`.

## Database setup

1. In the Vercel dashboard: **Storage → Create Database → Postgres** (powered by Neon) and connect it to this project. Also create a **Blob** store the same way, for PM avatar uploads.
2. Pull the resulting env vars locally: `vercel env pull .env.local`.
3. Create the tables and seed the mock initiatives (safe to re-run): `node --env-file=.env.local scripts/seed.js`.
4. Run `vercel dev` (or deploy) to use the app against the real database.

See `db/schema.sql` for the table definitions and `.env.example` for the env vars involved.

## Build

```bash
npm run build
```
