import { defineStore } from 'pinia'
import api from '../services/api.js'
import { useRecommendationsStore } from './recommendations.js'

function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
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

function normalizeItem(raw) {
  return {
    id: raw.id,
    tmdb_id: Number(raw.tmdb_id ?? raw.id),
    title: raw.title ?? 'Untitled',
    overview: raw.overview ?? '',
    poster_path: raw.poster_path ?? null,
    release_year: normalizeReleaseYear(raw.release_year),
    genres: normalizeGenres(raw.genres),
    watched_at: raw.watched_at ?? null,
  }
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    items: [],
    removingItemIds: [],
    loading: false,
    initialized: false,
    error: '',
    lastToken: null,
  }),

  getters: {
    sortedItems(state) {
      return [...state.items].sort((a, b) => {
        const first = Date.parse(a.watched_at || '') || 0
        const second = Date.parse(b.watched_at || '') || 0
        return second - first
      })
    },
  },

  actions: {
    async refreshRecommendations() {
      const recommendationsStore = useRecommendationsStore()
      const token = localStorage.getItem('token')

      if (!token) {
        recommendationsStore.clear()
        return
      }

      await recommendationsStore.fetch(true)
    },

    clearState() {
      this.items = []
      this.removingItemIds = []
      this.loading = false
      this.initialized = false
      this.error = ''
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
      await this.fetchHistory()
    },

    async fetchHistory() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.clearState()
        return
      }

      this.loading = true
      this.error = ''
      try {
        const data = await api.get('/history')
        const items = Array.isArray(data) ? data : (data.items || [])
        this.items = items.map(normalizeItem)
      } catch (error) {
        if (error?.status === 401) {
          this.clearState()
          return
        }
        this.error = error?.message || 'Failed to load watch history.'
      } finally {
        this.loading = false
      }
    },

    async removeItem(itemId) {
      const token = localStorage.getItem('token')
      if (!token) return

      const numericId = Number(itemId)
      if (!numericId || this.removingItemIds.includes(numericId)) return

      this.removingItemIds.push(numericId)
      this.error = ''

      try {
        await api.delete(`/history/${numericId}`)
        this.items = this.items.filter(item => Number(item.id) !== numericId)
        await this.refreshRecommendations()
      } catch (error) {
        if (error?.status === 401) {
          this.clearState()
          return
        }
        this.error = error?.message || 'Failed to remove watch history item.'
      } finally {
        this.removingItemIds = this.removingItemIds.filter(id => id !== numericId)
      }
    },
  },
})
