import { sql } from './_db.js'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  try {
    if (request.method === 'GET') {
      const rows = await sql`SELECT pm_name, pathname FROM pm_avatars`
      const map = {}
      for (const row of rows) map[row.pm_name] = row.pathname
      return Response.json(map)
    }

    if (request.method === 'PUT') {
      const { pmName, pathname } = await request.json()
      if (!pmName || !pathname) {
        return Response.json({ error: 'Missing pmName or pathname' }, { status: 400 })
      }
      await sql`
        INSERT INTO pm_avatars (pm_name, pathname, updated_at)
        VALUES (${pmName}, ${pathname}, now())
        ON CONFLICT (pm_name) DO UPDATE SET pathname = EXCLUDED.pathname, updated_at = now()
      `
      return Response.json({ pmName, pathname })
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
