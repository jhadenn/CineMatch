import { defineStore } from 'pinia'
import { getRecommendations } from '../services/api.js'

function defaultMeta() {
  return {
    mode: 'cold_start',
    reason: null,
  }
}

function normalizeMeta(meta, items) {
  if (meta?.mode === 'personalized' || meta?.mode === 'cold_start' || meta?.mode === 'fallback') {
    return {
      mode: meta.mode,
      reason: meta.reason || null,
    }
  }

  return {
    mode: items.length ? 'personalized' : 'cold_start',
    reason: null,
  }
}

export const useRecommendationsStore = defineStore('recommendations', {
  state: () => ({
    items: [],
    meta: defaultMeta(),
    loading: false,
    initialized: false,
    lastToken: null,
    error: '',
  }),

  actions: {
    async fetch(force = false) {
      const token = localStorage.getItem('token')
      if (!token) {
        this.clear()
        return
      }

      const tokenChanged = this.lastToken !== token
      if (this.initialized && !force && !tokenChanged) return

      this.loading = true
      this.error = ''

      if (tokenChanged) {
        this.items = []
        this.meta = defaultMeta()
      }

      try {
        const data = await getRecommendations()
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : []

        this.items = items
        this.meta = normalizeMeta(data?.meta, items)
        this.initialized = true
        this.lastToken = token
      } catch (error) {
        this.error = error?.message || 'Failed to load recommendations.'
      } finally {
        this.loading = false
      }
    },

    clear() {
      this.items = []
      this.meta = defaultMeta()
      this.loading = false
      this.initialized = false
      this.lastToken = null
      this.error = ''
    },
  },
})
