import { defineStore } from 'pinia'
import { getRecommendations } from '../services/api.js'

/**
 * Default metadata for recommendation responses.
 * `mode` helps the UI explain whether results are personalized or generic.
 */
function defaultMeta() {
  return {
    mode: 'cold_start',
    reason: null,
  }
}

/**
 * Normalize recommendation metadata so the UI can rely on a stable shape even
 * if the backend omits `meta` for simpler responses.
 */
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
      // Cache the last successful fetch per token so route changes do not keep
      // refetching the same recommendation set.
      if (this.initialized && !force && !tokenChanged) return

      this.loading = true
      this.error = ''

      if (tokenChanged) {
        // Different users should never briefly see the prior user's results.
        this.items = []
        this.meta = defaultMeta()
      }

      try {
        const data = await getRecommendations()
        // Support either the richer `{ items, meta }` response or a plain array.
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
      // Shared reset used for logout flows and unauthenticated visits.
      this.items = []
      this.meta = defaultMeta()
      this.loading = false
      this.initialized = false
      this.lastToken = null
      this.error = ''
    },
  },
})
