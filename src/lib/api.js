async function request(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${response.status})`)
  }
  return response.json()
}

export function fetchInitiatives() {
  return request('/api/initiatives')
}

export function createInitiative(initiative) {
  return request('/api/initiatives', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(initiative),
  })
}

export function updateInitiative(id, patch) {
  return request(`/api/initiatives?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export function fetchPmAvatars() {
  return request('/api/pm-avatars')
}

export function savePmAvatar(pmName, pathname) {
  return request('/api/pm-avatars', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pmName, pathname }),
  })
}
