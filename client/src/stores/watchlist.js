import { defineStore } from 'pinia'
import api from '../services/api.js'

function normalizeItem(raw, fallbackPosition = 0) {
  const tmdbId = Number(raw.tmdb_id ?? raw.id)
  return {
    id: raw.id,
    tmdb_id: tmdbId,
    title: raw.title ?? 'Untitled',
    poster_path: raw.poster_path ?? null,
    added_at: raw.added_at ?? new Date().toISOString(),
    position: Number.isFinite(raw.position) ? raw.position : fallbackPosition,
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
