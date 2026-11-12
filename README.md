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
- **Persistence** — initiatives and PM avatar metadata are saved to Firebase Cloud Firestore (avatar images themselves go to Vercel Blob); a "Saved" / "Local only" indicator in the header shows whether Firestore is reachable.

## Development

```bash
npm install
npm run dev
```

`npm run dev` talks to Firestore directly from the browser, so initiatives persist even under plain Vite. Avatar uploads go through the `/api/avatar/*` routes, which need the Vercel CLI: `vercel dev`.

## Database setup

Data lives in the Firebase project `roadmap-919ae` (config in `src/lib/firebase.js`).

1. In the Firebase console: **Build → Firestore Database** (create it if it doesn't exist).
2. Open the **Rules** tab, paste in the contents of `firestore.rules`, and click **Publish**. Without this, Firestore denies every request and the app stays in "Local only" mode.
3. Load the app. If the `initiatives` collection is empty, the app seeds it with the demo initiatives automatically.

Collections:

- `initiatives/{id}` — one document per initiative (title, description, pm, journey, coreValue, status, health, progress, impact, tags, startMonth, trackerLink, confluenceLink, archived, createdAt, updatedAt).
- `pmAvatars/{pmName}` — `{ pathname, updatedAt }`, pointing at the avatar image in Vercel Blob.

For avatar uploads, also create a **Blob** store in the Vercel dashboard (**Storage → Create Database → Blob**) and pull its token with `vercel env pull .env.local`.

## Build

```bash
npm run build
```
