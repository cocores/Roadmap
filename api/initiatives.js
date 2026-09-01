import { sql } from './_db.js'

export const config = { runtime: 'edge' }

function rowToInitiative(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    pm: row.pm,
    journey: row.journey,
    coreValue: row.core_value,
    status: row.status,
    health: row.health,
    progress: row.progress,
    impact: row.impact,
    tags: row.tags ?? [],
    startMonth: row.start_month,
    trackerLink: row.tracker_link,
    confluenceLink: row.confluence_link,
    archived: row.archived,
  }
}

export default async function handler(request) {
  try {
    if (request.method === 'GET') {
      const rows = await sql`SELECT * FROM initiatives ORDER BY start_month ASC, title ASC`
      return Response.json(rows.map(rowToInitiative))
    }

    if (request.method === 'POST') {
      const body = await request.json()
      if (!body.id) {
        return Response.json({ error: 'Missing id' }, { status: 400 })
      }

      const rows = await sql`
        INSERT INTO initiatives (
          id, title, description, pm, journey, core_value, status, health,
          progress, impact, tags, start_month, tracker_link, confluence_link, archived
        ) VALUES (
          ${body.id}, ${body.title}, ${body.description ?? ''}, ${body.pm}, ${body.journey},
          ${body.coreValue ?? null}, ${body.status}, ${body.health ?? null},
          ${body.progress ?? 0}, ${body.impact ?? ''}, ${body.tags ?? []},
          ${body.startMonth}, ${body.trackerLink ?? null}, ${body.confluenceLink ?? null},
          ${body.archived ?? false}
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING *
      `
      if (rows.length === 0) {
        return Response.json({ error: 'An initiative with this id already exists' }, { status: 409 })
      }
      return Response.json(rowToInitiative(rows[0]), { status: 201 })
    }

    if (request.method === 'PUT') {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (!id) {
        return Response.json({ error: 'Missing id query param' }, { status: 400 })
      }

      const existing = await sql`SELECT * FROM initiatives WHERE id = ${id}`
      if (existing.length === 0) {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }

      // Read-modify-write: merge the patch over the current row in JS, then
      // rewrite every column. Avoids fragile per-column COALESCE/null-vs-
      // omitted logic in SQL for what's really just a partial patch.
      const patch = await request.json()
      const merged = { ...rowToInitiative(existing[0]), ...patch }

      const rows = await sql`
        UPDATE initiatives SET
          title = ${merged.title},
          description = ${merged.description},
          pm = ${merged.pm},
          journey = ${merged.journey},
          core_value = ${merged.coreValue ?? null},
          status = ${merged.status},
          health = ${merged.health ?? null},
          progress = ${merged.progress},
          impact = ${merged.impact},
          tags = ${merged.tags ?? []},
          start_month = ${merged.startMonth},
          tracker_link = ${merged.trackerLink ?? null},
          confluence_link = ${merged.confluenceLink ?? null},
          archived = ${merged.archived ?? false},
          updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `
      return Response.json(rowToInitiative(rows[0]))
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (err) {
    return Response.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
