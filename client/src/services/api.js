// Own backend API calls (auth, watchlist, history, recommendations)

const BASE = '/api'

/**
 * Shared wrapper for CineMatch backend requests.
 * It attaches the JWT from localStorage when present and assumes JSON bodies.
 */
async function request(method, path, body) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    let message = `API error: ${res.status}`
    try {
      const payload = await res.json()
      if (payload?.error) message = payload.error
    } catch {
      // Response may not be JSON; keep status-based fallback.
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  // Some endpoints (e.g. DELETE) return 204 with no JSON body.
  if (res.status === 204) return null
  return res.json()
}

export function getRecommendations() {
  return request('GET', '/recommendations')
}

export function getMovieMatch(tmdbId) {
  return request('GET', `/recommendations/match/${tmdbId}`)
}

export function getStats() {
  return request('GET', '/history/stats')
}

export default {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
  getRecommendations,
  getMovieMatch,
  getStats,
}
