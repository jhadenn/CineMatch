// TMDB API calls — all proxied through /api/tmdb/* on our Express server
// so the TMDB API key is never exposed to the browser.

const BASE = '/api/tmdb'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

async function get(path, params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = `${BASE}/${path}${query ? `?${query}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

export function searchMovies(query, page = 1) {
  return get('search/movie', { query, page })
}

export function getTrending(page = 1) {
  return get('trending/movie/week', { page })
}

export function discoverMovies(filters = {}, page = 1) {
  const params = { page, sort_by: 'popularity.desc' }
  if (filters.genre) params.with_genres = filters.genre
  if (filters.yearFrom) params['primary_release_date.gte'] = `${filters.yearFrom}-01-01`
  if (filters.yearTo) params['primary_release_date.lte'] = `${filters.yearTo}-12-31`
  if (filters.minRating) params['vote_average.gte'] = filters.minRating
  return get('discover/movie', params)
}

export function getGenres() {
  return get('genre/movie/list')
}

export function posterUrl(path) {
  return path ? `${IMAGE_BASE}${path}` : null
}

export default { get, searchMovies, getTrending, discoverMovies, getGenres, posterUrl }
