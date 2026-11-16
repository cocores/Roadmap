import { useEffect } from 'react'

// Board settings (year, view, filters, page) live in the URL so a filtered
// view can be shared as a link, and in localStorage so each person's last
// setup is remembered. URL wins when both are present.

const STORAGE_KEY = 'roadmap:settings'

const LIST_KEYS = ['pm', 'journey', 'cv', 'health']

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStorage(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Private mode / blocked storage: settings just won't be remembered.
  }
}

// Parses a settings query string (from the URL or a saved preset).
export function parseQuery(query) {
  const params = new URLSearchParams(query)
  const out = {}
  for (const [key, value] of params) {
    if (LIST_KEYS.includes(key)) out[key] = value ? value.split(',') : []
    else if (key === 'year') out.year = Number(value)
    else if (key === 'group') out.group = value !== '0'
    else out[key] = value
  }
  return out
}

export function readInitialSettings(defaults) {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = parseQuery(window.location.search)
  // A shared link with any setting in it is used as-is (on top of defaults),
  // so recipients see exactly what the sender saw.
  const base = params.toString() ? {} : readStorage()
  const merged = { ...defaults, ...base, ...fromUrl }
  if (!Number.isInteger(merged.year)) merged.year = defaults.year
  return merged
}

export function settingsToQuery(s) {
  const params = new URLSearchParams()
  params.set('page', s.page)
  params.set('year', String(s.year))
  params.set('view', s.view)
  if (s.layout) params.set('layout', s.layout)
  if (s.tl && s.tl !== 'journey') params.set('tl', s.tl)
  for (const key of LIST_KEYS) if (s[key]?.length) params.set(key, s[key].join(','))
  if (s.q) params.set('q', s.q)
  if (!s.group) params.set('group', '0')
  return params.toString()
}

export function useSyncedSettings(settings) {
  const query = settingsToQuery(settings)
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
    writeStorage(settings)
    // `query` captures every setting, so it's the only dependency needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
}

export function shareUrl(settings) {
  return `${window.location.origin}${window.location.pathname}?${settingsToQuery(settings)}`
}
