import { defineStore } from 'pinia'
import api from '../services/api.js'
import { useMoviesStore } from './movies.js'

function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function releaseYearFromMovie(movie) {
  if (movie?.release_year != null) return normalizeReleaseYear(movie.release_year)
  if (typeof movie?.release_date !== 'string') return null
  return normalizeReleaseYear(movie.release_date.slice(0, 4))
}

function normalizeGenres(value) {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const normalized = []
  for (const entry of value) {
    const genreName = typeof entry === 'string'
      ? entry.trim()
      : typeof entry?.name === 'string'
        ? entry.name.trim()
        : ''

    if (!genreName) continue

    const dedupeKey = genreName.toLowerCase()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    normalized.push(genreName)
  }

  return normalized
}

async function resolveGenreNames(movie) {
  const directGenres = normalizeGenres(movie?.genres)
  if (directGenres.length) return directGenres

  const genreIds = Array.isArray(movie?.genre_ids)
    ? movie.genre_ids.map(id => Number(id)).filter(Number.isFinite)
    : []
  if (!genreIds.length) return []

  try {
    const moviesStore = useMoviesStore()
    if (!moviesStore.genres.length) {
      await moviesStore.fetchGenres()
    }

    const lookup = new Map(
      (moviesStore.genres || []).map(genre => [Number(genre.id), genre.name])
    )

    return normalizeGenres(genreIds.map(id => lookup.get(id)))
  } catch {
    return []
  }
}

function normalizeItem(raw, fallbackPosition = 0) {
  const tmdbId = Number(raw.tmdb_id ?? raw.id)
  const position = Number(raw.position)
  return {
    id: raw.id,
    tmdb_id: tmdbId,
    title: raw.title ?? 'Untitled',
    poster_path: raw.poster_path ?? null,
    release_year: normalizeReleaseYear(raw.release_year),
    release_date: raw.release_date ?? null,
    genres: normalizeGenres(raw.genres),
    added_at: raw.added_at ?? new Date().toISOString(),
    position: Number.isFinite(position) ? position : fallbackPosition,
  }
}

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    items: [],
    loading: false,
    initialized: false,
    error: '',
    lastToken: null,
  }),

  getters: {
    sortedItems(state) {
      return [...state.items].sort((a, b) => a.position - b.position)
    },
    totalCount(state) {
      return state.items.length
    },
  },

  actions: {
    clearState() {
      this.items = []
      this.error = ''
      this.initialized = false
      this.lastToken = null
    },

    async initialize(force = false) {
      const token = localStorage.getItem('token')
      if (!token) {
        this.clearState()
        return
      }

      const tokenChanged = this.lastToken !== token
      if (this.initialized && !force && !tokenChanged) return

      this.initialized = true
      this.lastToken = token
      await this.fetchWatchlist()
    },

    async fetchWatchlist() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.clearState()
        return
      }

      this.loading = true
      this.error = ''
      try {
        const data = await api.get('/watchlist')
        const items = Array.isArray(data) ? data : (data.items || [])
        this.items = items.map((item, index) => normalizeItem(item, index))
      } catch (error) {
        if (error?.status === 401) {
          this.clearState()
          return
        }
        this.error = error?.message || 'Failed to load watchlist.'
      } finally {
        this.loading = false
      }
    },

    async addMovie(movie) {
      const token = localStorage.getItem('token')
      if (!token) return { added: false, reason: 'unauthorized' }

      const tmdbId = Number(movie?.id ?? movie?.tmdb_id)
      if (!tmdbId) return { added: false, reason: 'invalid' }
      const exists = this.items.some(item => Number(item.tmdb_id) === tmdbId)
      if (exists) return { added: false, reason: 'exists' }

      const payload = {
        tmdb_id: tmdbId,
        title: movie.title,
        poster_path: movie.poster_path || null,
        release_year: releaseYearFromMovie(movie),
        genres: await resolveGenreNames(movie),
      }

      try {
        const created = await api.post('/watchlist', payload)
        if (created?.id) {
          this.items.push(normalizeItem(created, this.items.length))
        }
      } catch (error) {
        if (error?.status === 409) return { added: false, reason: 'exists' }
        if (error?.status === 401) return { added: false, reason: 'unauthorized' }
        return { added: false, reason: 'failed' }
      }

      return { added: true }
    },

    async removeItem(itemId) {
      const token = localStorage.getItem('token')
      if (!token) return
      const idx = this.items.findIndex(item => String(item.id) === String(itemId))
      if (idx < 0) return

      try {
        await api.delete(`/watchlist/${itemId}`)
        this.items.splice(idx, 1)
        this.reindexPositions()
      } catch (error) {
        if (error?.status === 401) {
          this.clearState()
        }
      }
    },

    async moveItem(fromIndex, toIndex) {
      const token = localStorage.getItem('token')
      if (!token) return
      if (fromIndex === toIndex) return
      if (fromIndex < 0 || toIndex < 0) return
      if (fromIndex >= this.items.length || toIndex >= this.items.length) return

      const next = [...this.sortedItems]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      this.items = next.map((item, index) => ({ ...item, position: index }))

      try {
        await api.patch('/watchlist/order', {
          items: this.items.map(item => ({ id: item.id, position: item.position })),
        })
      } catch {
        await this.fetchWatchlist()
      }
    },

    reindexPositions() {
      this.items = this.sortedItems.map((item, index) => ({ ...item, position: index }))
    },
  },
})
