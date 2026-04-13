import { defineStore } from 'pinia'
import api from '../services/api.js'

const STORAGE_KEY = 'cinematch_watchlist'

function normalizeItem(raw, fallbackPosition = 0) {
  const tmdbId = Number(raw.tmdb_id ?? raw.id)
  return {
    id: raw.id ?? `${tmdbId}-${Date.now()}`,
    tmdb_id: tmdbId,
    title: raw.title ?? 'Untitled',
    poster_path: raw.poster_path ?? null,
    release_date: raw.release_date ?? null,
    vote_average: raw.vote_average ?? null,
    added_at: raw.added_at ?? new Date().toISOString(),
    position: Number.isFinite(raw.position) ? raw.position : fallbackPosition,
  }
}

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    items: [],
    loading: false,
    initialized: false,
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
    loadFromStorage() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        this.items = []
        return
      }

      try {
        const parsed = JSON.parse(raw)
        this.items = (Array.isArray(parsed) ? parsed : []).map((item, index) =>
          normalizeItem(item, index)
        )
      } catch {
        this.items = []
      }
    },

    saveToStorage() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    },

    async initialize() {
      if (this.initialized) return
      this.initialized = true
      await this.fetchWatchlist()
    },

    async fetchWatchlist() {
      this.loading = true
      try {
        const data = await api.get('/watchlist')
        const items = Array.isArray(data) ? data : (data.items || [])
        this.items = items.map((item, index) => normalizeItem(item, index))
        this.saveToStorage()
      } catch {
        // Fall back to local persistence while backend auth/watchlist is evolving.
        this.loadFromStorage()
      } finally {
        this.loading = false
      }
    },

    async addMovie(movie) {
      const tmdbId = Number(movie?.id ?? movie?.tmdb_id)
      if (!tmdbId) return { added: false, reason: 'invalid' }
      const exists = this.items.some(item => Number(item.tmdb_id) === tmdbId)
      if (exists) return { added: false, reason: 'exists' }

      const payload = {
        tmdb_id: tmdbId,
        title: movie.title,
        poster_path: movie.poster_path || null,
        release_date: movie.release_date || null,
        vote_average: movie.vote_average || null,
      }

      const localItem = normalizeItem(
        { ...payload, id: `${tmdbId}-${Date.now()}` },
        this.items.length
      )
      this.items.push(localItem)
      this.saveToStorage()

      try {
        const created = await api.post('/watchlist', payload)
        if (created?.id) {
          const idx = this.items.findIndex(item => item.id === localItem.id)
          if (idx >= 0) this.items[idx].id = created.id
          this.saveToStorage()
        }
      } catch {
        // Keep local item so UI remains functional without backend auth wiring.
      }

      return { added: true }
    },

    async removeItem(itemId) {
      const idx = this.items.findIndex(item => String(item.id) === String(itemId))
      if (idx < 0) return
      const [removed] = this.items.splice(idx, 1)
      this.reindexPositions()
      this.saveToStorage()

      try {
        await api.delete(`/watchlist/${removed.id}`)
      } catch {
        // Ignore backend failures and preserve local state.
      }
    },

    async moveItem(fromIndex, toIndex) {
      if (fromIndex === toIndex) return
      if (fromIndex < 0 || toIndex < 0) return
      if (fromIndex >= this.items.length || toIndex >= this.items.length) return

      const next = [...this.sortedItems]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      this.items = next.map((item, index) => ({ ...item, position: index }))
      this.saveToStorage()

      try {
        await api.patch('/watchlist/order', {
          items: this.items.map(item => ({ id: item.id, position: item.position })),
        })
      } catch {
        // Keep local ordering when backend endpoint is unavailable.
      }
    },

    reindexPositions() {
      this.items = this.sortedItems.map((item, index) => ({ ...item, position: index }))
    },
  },
})
