// TMDB API calls — all proxied through /api/tmdb/* on our Express server
// so the TMDB API key is never exposed to the browser.

const BASE = '/api/tmdb'

async function get(path, params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = `${BASE}/${path}${query ? `?${query}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

export default { get }
