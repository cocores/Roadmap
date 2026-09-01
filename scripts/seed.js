// One-time setup: creates the tables (if missing) and seeds the mock
// initiatives (if the table is empty). Safe to re-run.
//
// Usage: DATABASE_URL=postgres://... node scripts/seed.js
// or, with Vercel env vars pulled locally: node --env-file=.env.local scripts/seed.js

import { neon } from '@neondatabase/serverless'
import { initialInitiatives } from '../src/data/mockInitiatives.js'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL

if (!connectionString) {
  console.error(
    'Set DATABASE_URL (or POSTGRES_URL) before running this script — e.g.\n' +
      '  vercel env pull .env.local   # after connecting a Postgres/Neon database in the Vercel dashboard\n' +
      '  node --env-file=.env.local scripts/seed.js'
  )
  process.exit(1)
}

const sql = neon(connectionString)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      pm TEXT NOT NULL,
      journey TEXT NOT NULL,
      core_value TEXT,
      status TEXT NOT NULL,
      health TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      impact TEXT NOT NULL DEFAULT '',
      tags TEXT[] NOT NULL DEFAULT '{}',
      start_month INTEGER NOT NULL,
      tracker_link TEXT,
      confluence_link TEXT,
      archived BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pm_avatars (
      pm_name TEXT PRIMARY KEY,
      pathname TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('Tables ready.')

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM initiatives`
  if (count > 0) {
    console.log(`initiatives already has ${count} row(s) — skipping seed.`)
    return
  }

  for (const init of initialInitiatives) {
    await sql`
      INSERT INTO initiatives (
        id, title, description, pm, journey, core_value, status, health,
        progress, impact, tags, start_month, tracker_link, confluence_link, archived
      ) VALUES (
        ${init.id}, ${init.title}, ${init.description}, ${init.pm}, ${init.journey},
        ${init.coreValue ?? null}, ${init.status}, ${init.health ?? null},
        ${init.progress}, ${init.impact}, ${init.tags},
        ${init.startMonth}, ${init.trackerLink ?? null}, ${init.confluenceLink ?? null}, false
      )
    `
  }
  console.log(`Seeded ${initialInitiatives.length} initiatives.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
