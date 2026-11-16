# PM Roadmap

A collaborative product manager roadmap board built with React, Tailwind CSS, and Lucide Icons.

## Features

- **Board** — Month / Quarter / H1-H2 views, one year at a time, grouped by customer journey or as a flat Kanban. Drag cards between time buckets and journeys; drop a card onto another to rank it just above (priorities renumber 1..n inside that bucket).
- **Initiatives** — PM, journey, core value, status, health (stop light), progress, impact, tags, year, start bucket, optional end month, priority, "blocked by" dependencies, and Jira/Confluence links. Every edit is recorded in a per-initiative change history.
- **Stakeholder view** — read-only, light-themed presentation page: summary stats, a "Needs attention" list, a Gantt-style timeline by journey with a today marker, and a Now / Next / Later mode. Copy a share link, present full screen, print to PDF, or download a PNG.
- **Compare** — save snapshots of the roadmap and see what shipped, slipped, was pulled in, was added/removed, or changed health since then.
- **Live sync** — changes from other people appear immediately.
- **Shareable, remembered settings** — year, view, page and filters are kept in the URL (so links reproduce exactly what you see) and remembered per browser.
- **CSV import/export** — from the "⋯" menu in the header.
- **Optional Google sign-in** — restrict to your company domain, with an editor list; everyone else is read-only (see below).
- **Mobile friendly**, dark/light themes.

## Development

```bash
npm install
npm run dev
```

`npm run dev` talks to Firestore directly from the browser, so initiatives persist even under plain Vite — there are no server routes.

## Database setup

Data lives in the Firebase project `roadmap-919ae` (config in `src/lib/firebase.js`).

1. Firebase console → **Firestore Database** → **Rules**: paste `firestore.rules` and **Publish**. (These are open rules that allow the `initiatives`, `changes` and `snapshots` collections.)
2. Load the app. If `initiatives` is empty, it seeds the demo initiatives.

Collections: `initiatives/{id}`, `changes/{id}` (change history), `snapshots/{id}` (saved roadmaps for Compare), and — with sign-in on — `settings/access`.

## Turning on sign-in

1. Firebase console → **Authentication** → **Sign-in method** → enable **Google**. Under **Settings → Authorized domains**, add the domain the app is deployed on (e.g. your Vercel URL).
2. In `src/lib/auth.js`, set `ALLOWED_DOMAIN` to your company email domain (e.g. `example.com`).
3. In Firestore, create the document `settings/access` with a field `editors` (type *array*) listing the emails allowed to edit, in lowercase.
4. In `firestore.auth.rules`, replace `example\.com` with your domain, then paste it into **Firestore → Rules** and **Publish**.
5. Deploy. Everyone at the domain can sign in and view; only listed editors can change things.

## Build

```bash
npm run build
```
