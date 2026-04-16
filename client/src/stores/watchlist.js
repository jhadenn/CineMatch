import { defineStore } from 'pinia'
import api from '../services/api.js'
import { useMoviesStore } from './movies.js'
import { useRecommendationsStore } from './recommendations.js'
import { getMovieDetails } from '../services/tmdb.js'

/**
 * Watchlist and history payloads can come from TMDB, SQLite rows, or cached UI
 * state. These small normalizers keep the store's public item shape stable.
 */
function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeRuntime(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function normalizeVoteAverage(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function releaseYearFromMovie(movie) {
  if (movie?.release_year != null) return normalizeReleaseYear(movie.release_year)
  if (typeof movie?.release_date !== 'string') return null
  return normalizeReleaseYear(movie.release_date.slice(0, 4))
}

function runtimeFromMovie(movie) {
  return normalizeRuntime(movie?.runtime)
}

function voteAverageFromMovie(movie) {
  return normalizeVoteAverage(movie?.vote_average)
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

function extractDirector(movie) {
  const director = Array.isArray(movie?.credits?.crew)
    ? movie.credits.crew.find(person => person?.job === 'Director')?.name
    : null

  return typeof director === 'string' && director.trim() ? director.trim() : null
}

async function resolveGenreNames(movie) {
  // Search results only include genre ids, so consult the shared genre cache.
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
    runtime: normalizeRuntime(raw.runtime),
    vote_average: normalizeVoteAverage(raw.vote_average),
    genres: normalizeGenres(raw.genres),
    added_at: raw.added_at ?? new Date().toISOString(),
    position: Number.isFinite(position) ? position : fallbackPosition,
  }
}

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    items: [],
    markingItemIds: [],
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
    /**
     * Recommendations depend on both saved and watched titles, so write actions
     * refresh the feed after they successfully change the user's profile.
     */
    async refreshRecommendations() {
      const recommendationsStore = useRecommendationsStore()
      const token = localStorage.getItem('token')

      if (!token) {
        recommendationsStore.clear()
        return
      }

      await recommendationsStore.fetch(true)
    },

    /**
     * Drop all user-specific state. Called when auth disappears or a request is
     * rejected as unauthorized.
     */
    clearState() {
      this.items = []
      this.markingItemIds = []
      this.error = ''
      this.initialized = false
      this.lastToken = null
    },

    /**
     * Load the watchlist once per token unless the caller asks for a refresh.
     */
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

    /**
     * Persist a TMDB movie into the ordered watchlist.
     * The backend hydrates any missing metadata before returning the created row.
     */
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
        runtime: runtimeFromMovie(movie),
        vote_average: voteAverageFromMovie(movie),
        genres: await resolveGenreNames(movie),
      }

      try {
        const created = await api.post('/watchlist', payload)
        if (created?.id) {
          this.items.push(normalizeItem(created, this.items.length))
          await this.refreshRecommendations()
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
        await this.refreshRecommendations()
      } catch (error) {
        if (error?.status === 401) {
          this.clearState()
        }
      }
    },

    async markAsWatched(item) {
      const token = localStorage.getItem('token')
      if (!token) return { ok: false, reason: 'unauthorized' }

      const itemId = Number(item?.id)
      const tmdbId = Number(item?.tmdb_id)
      if (!itemId || !tmdbId) return { ok: false, reason: 'invalid' }
      if (this.markingItemIds.includes(itemId)) return { ok: false, reason: 'busy' }

      this.markingItemIds.push(itemId)
      this.error = ''

      try {
        let details = null

        try {
          details = await getMovieDetails(tmdbId)
        } catch {
          // If TMDB details fail, keep going with the watchlist metadata and let
          // the backend hydrate missing fields lazily for embeddings later.
        }

        const resolvedGenres = normalizeGenres(details?.genres).length
          ? normalizeGenres(details?.genres)
          : normalizeGenres(item?.genres)

        const payload = {
          tmdb_id: tmdbId,
          title: details?.title || item.title,
          overview: typeof details?.overview === 'string' ? details.overview.trim() : '',
          poster_path: details?.poster_path ?? item.poster_path ?? null,
          release_year: releaseYearFromMovie(details) ?? releaseYearFromMovie(item),
          runtime: runtimeFromMovie(details) ?? runtimeFromMovie(item),
          vote_average: voteAverageFromMovie(details) ?? voteAverageFromMovie(item),
          genres: resolvedGenres,
          director: extractDirector(details),
        }

        // Move the item through history first, then remove it from the queue.
        // A duplicate history row still counts as success for the user's action.
        try {
          await api.post('/history', payload)
        } catch (error) {
          if (error?.status !== 409) throw error
        }

        await api.delete(`/watchlist/${itemId}`)
        this.items = this.items.filter(entry => Number(entry.id) !== itemId)
        this.reindexPositions()
        await this.refreshRecommendations()

        return { ok: true }
      } catch (error) {
        if (error?.status === 401) {
          this.clearState()
          return { ok: false, reason: 'unauthorized' }
        }

        this.error = error?.message || 'Failed to mark movie as watched.'
        return { ok: false, reason: 'failed' }
      } finally {
        this.markingItemIds = this.markingItemIds.filter(id => id !== itemId)
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
        // Optimistic UI keeps reordering instant; refetch if persistence fails.
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
