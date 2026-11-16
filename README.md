# PM Roadmap

A collaborative product manager roadmap board built with React, Tailwind CSS, and Lucide Icons.

## Features

- **Board** — Month / Quarter / H1-H2 views, one year at a time, grouped by customer journey or as a flat Kanban. Drag cards between time buckets and journeys; drop a card onto another to rank it just above (priorities renumber 1..n inside that bucket).
- **Initiatives** — PM, journey, core value, status, health (stop light), progress, impact, tags, year, start bucket, optional end month, priority, "blocked by" dependencies, and Jira/Confluence links. Every edit is recorded in a per-initiative change history.
- **Stakeholder view** — read-only, light-themed presentation page: an editable executive summary per year, summary stats, a "Needs attention" list with each item's latest update, a Gantt-style timeline (grouped by journey, PM or core value) with milestones, dependency arrows and a today marker, a Now / Next / Later mode, "Delivered" and "Expected impact" sections, and slide mode for meetings. Save named audience views with short links, copy a share link, print to PDF, or download a PNG.
- **Compare** — save snapshots of the roadmap and see what shipped, slipped, was pulled in, was added/removed, or changed health since then.
- **Live sync** — changes from other people appear immediately.
- **Shareable, remembered settings** — year, view, page and filters are kept in the URL (so links reproduce exactly what you see) and remembered per browser.
- **CSV import/export** — from the "⋯" menu in the header.
- **Microsoft sign-in** — restricted to the company domain, with an editor list; everyone else is read-only (see below).
- **Mobile friendly**, dark/light themes.

## Development

```bash
npm install
npm run dev
```

`npm run dev` talks to Firestore directly from the browser, so initiatives persist even under plain Vite — there are no server routes.

## Database setup

Data lives in the Firebase project `roadmap-919ae` (config in `src/lib/firebase.js`).

1. Firebase console → **Firestore Database** → **Rules**: paste `firestore.rules` and **Publish**. (These are open rules that allow the `initiatives`, `changes`, `snapshots`, `summaries` and `presets` collections.)
2. Load the app. If `initiatives` is empty, it seeds the demo initiatives.

Collections: `initiatives/{id}`, `changes/{id}` (change history), `snapshots/{id}` (saved roadmaps for Compare), `summaries/{year}` (stakeholder executive summary), `presets/{id}` (saved stakeholder views), and — with sign-in on — `settings/access`.

## Turning on sign-in (Microsoft / Outlook accounts)

Sign-in uses Microsoft work accounts and is **currently off**. After the steps below, set `ALLOWED_DOMAIN` in `src/lib/auth.js` to `'bhphoto.com'` and deploy.

1. **Register an app in Microsoft Entra ID** (Azure portal → Microsoft Entra ID → App registrations → New registration; usually needs IT):
   - Supported account types: **Accounts in this organizational directory only** (single tenant). This is what keeps non-company accounts out.
   - Redirect URI (Web): `https://roadmap-919ae.firebaseapp.com/__/auth/handler`
   - After creating it, copy the **Application (client) ID**, then under **Certificates & secrets** create a **client secret** and copy its value.
2. **Firebase console → Authentication → Sign-in method → Add new provider → Microsoft**: paste the client ID and secret, enable, save.
3. **Authentication → Settings → Authorized domains**: add the domain the app is served from (your Vercel URL / custom domain).
4. **Firestore → Data**: create collection `settings`, document `access`, with an array field `editors` listing editor emails in lowercase.
5. **Firestore → Rules**: paste `firestore.auth.rules` and **Publish**.

Everyone at the domain can sign in and view; only listed editors can change things.

## Build

```bash
npm run build
```
