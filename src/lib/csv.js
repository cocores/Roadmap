import { CORE_VALUES, HEALTH, JOURNEYS, MONTHS, PMS, STATUSES } from '../data/constants'

// Column order for export; import accepts these headers in any order.
const COLUMNS = [
  'id', 'title', 'description', 'pm', 'journey', 'coreValue', 'status', 'health',
  'progress', 'impact', 'tags', 'year', 'startMonth', 'endMonth', 'priority',
  'blockedBy', 'statusNote', 'milestones', 'trackerLink', 'confluenceLink',
]

function escapeCell(value) {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function initiativesToCsv(initiatives) {
  const rows = initiatives.map((i) =>
    COLUMNS.map((col) => {
      if (col === 'tags') return i.tags.join('; ')
      if (col === 'blockedBy') return (i.blockedBy ?? []).join('; ')
      if (col === 'milestones') return (i.milestones ?? []).map((m) => `${m.name} @ ${m.date}`).join('; ')
      if (col === 'startMonth') return MONTHS[i.startMonth]
      if (col === 'endMonth') return i.endMonth == null ? '' : MONTHS[i.endMonth]
      return i[col]
    })
  )
  return [COLUMNS, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n')
}

export function downloadCsv(filename, text) {
  // BOM so Excel opens UTF-8 (em dashes, accents) correctly.
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// RFC 4180-style parser: quoted fields, escaped quotes, CRLF/LF.
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function parseMonth(value) {
  const v = value.trim()
  if (!v) return null
  const byName = MONTHS.findIndex((m) => m.toLowerCase() === v.slice(0, 3).toLowerCase())
  if (byName !== -1) return byName
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n - 1 : undefined
}

function matchName(list, value) {
  const v = value.trim().toLowerCase()
  return list.find((x) => x.name.toLowerCase() === v)?.name
}

// Turns CSV text into rows ready to save, plus per-row problems. Rows whose
// `id` matches an existing initiative update it; others create new ones.
export function csvToInitiatives(text, existing) {
  const [header, ...body] = parseCsv(text)
  if (!header) return { rows: [], errors: ['The file is empty.'] }
  const cols = header.map((h) => h.trim())
  if (!cols.includes('title')) return { rows: [], errors: ['Missing a "title" column.'] }
  const existingById = Object.fromEntries(existing.map((i) => [i.id, i]))

  const rows = []
  const errors = []
  body.forEach((cells, idx) => {
    const line = idx + 2
    const get = (col) => (cols.includes(col) ? (cells[cols.indexOf(col)] ?? '').trim() : null)
    const id = get('id')
    const current = id && existingById[id]
    const problems = []
    const data = {}

    const title = get('title')
    if (title != null) data.title = title
    if (!current && !title) problems.push('title is required')

    for (const [col, list] of [['pm', PMS], ['journey', JOURNEYS], ['status', STATUSES], ['health', HEALTH], ['coreValue', CORE_VALUES]]) {
      const v = get(col)
      if (v == null || v === '') continue
      const name = matchName(list, v)
      if (name) data[col] = name
      else problems.push(`unknown ${col} "${v}"`)
    }
    for (const col of ['description', 'impact', 'statusNote', 'trackerLink', 'confluenceLink']) {
      const v = get(col)
      if (v != null) data[col] = v
    }
    const tags = get('tags')
    if (tags != null) data.tags = tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
    const milestones = get('milestones')
    if (milestones != null) {
      data.milestones = []
      for (const part of milestones.split(';').map((m) => m.trim()).filter(Boolean)) {
        const m = part.match(/^(.*?)\s*@\s*(\d{4}-\d{2}-\d{2})$/)
        if (m) data.milestones.push({ name: m[1], date: m[2] })
        else problems.push(`milestone "${part}" should look like "Beta @ 2026-03-15"`)
      }
    }
    const blockedBy = get('blockedBy')
    if (blockedBy != null) data.blockedBy = blockedBy.split(/[;,]/).map((t) => t.trim()).filter(Boolean)

    for (const col of ['progress', 'year', 'priority']) {
      const v = get(col)
      if (v == null || v === '') {
        if (col === 'priority' && v === '') data.priority = null
        continue
      }
      const n = Number(v)
      if (Number.isFinite(n)) data[col] = Math.round(n)
      else problems.push(`${col} "${v}" is not a number`)
    }
    for (const col of ['startMonth', 'endMonth']) {
      const v = get(col)
      if (v == null) continue
      const m = parseMonth(v)
      if (m === undefined) problems.push(`${col} "${v}" is not a month`)
      else if (m !== null || col === 'endMonth') data[col] = m
    }

    if (problems.length) {
      errors.push(`Row ${line}: ${problems.join(', ')}`)
      return
    }
    if (current) {
      rows.push({ id, data, isNew: false })
    } else {
      rows.push({
        id: crypto.randomUUID(),
        isNew: true,
        data: {
          pm: PMS[0].name,
          journey: JOURNEYS[0].name,
          status: STATUSES[0].name,
          health: HEALTH[0].name,
          startMonth: 0,
          year: new Date().getFullYear(),
          ...data,
          archived: false,
        },
      })
    }
  })
  return { rows, errors }
}
