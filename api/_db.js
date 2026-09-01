import { neon } from '@neondatabase/serverless'

// Whichever env var name Vercel's Postgres/Neon integration ends up using.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL

export const sql = connectionString
  ? neon(connectionString)
  : () => {
      throw new Error(
        'No database connection string found (checked DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL). Connect a Postgres/Neon database to this project.'
      )
    }
