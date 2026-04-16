import { defineStore } from 'pinia'
import api from '../services/api.js'
import { useHistoryStore } from './history.js'
import { useRecommendationsStore } from './recommendations.js'

const TOKEN_KEY = 'token'
const USER_KEY = 'cinematch_user'

/**
 * Convert low-level fetch/API errors into messages the login/register screens
 * can show without each view duplicating backend connectivity handling.
 */
function humanizeAuthError(error, fallback) {
  const raw = String(error?.message || '')
  if (!raw) return fallback
  if (raw === 'Failed to fetch' || raw.includes('NetworkError')) {
    return 'Cannot reach server. Start the backend with `npm run dev:server` and try again.'
  }
  return raw
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated(state) {
      return Boolean(state.token)
    },
  },

  actions: {
    /**
     * Restore persisted auth state once per app session.
     * The token stays in its historical `token` key because api.js reads that
     * same key before attaching Authorization headers.
     */
    initialize() {
      if (this.initialized) return
      this.initialized = true
      this.token = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser)
        } catch {
          this.user = null
        }
      }
    },

    /**
     * Keep Pinia state and localStorage in sync after a successful auth call.
     */
    persistAuth(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },

    /**
     * Sign in through the backend and return a small result object so forms can
     * stay presentation-focused instead of catching exceptions.
     */
    async login({ email, password }) {
      this.loading = true
      try {
        const data = await api.post('/auth/login', { email, password })
        if (data?.token) {
          this.persistAuth(data.token, data.user || { email })
          return { ok: true }
        }
        return { ok: false, error: 'Invalid login response.' }
      } catch (error) {
        return { ok: false, error: humanizeAuthError(error, 'Unable to sign in right now. Please try again.') }
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a user account and persist the returned token exactly like login.
     */
    async register({ username, email, password }) {
      this.loading = true
      try {
        const data = await api.post('/auth/register', { username, email, password })
        if (data?.token) {
          this.persistAuth(data.token, data.user || { username, email })
          return { ok: true }
        }
        return { ok: false, error: 'Invalid register response.' }
      } catch (error) {
        return { ok: false, error: humanizeAuthError(error, 'Unable to create account right now. Please try again.') }
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear auth state plus dependent user-specific stores to prevent stale
     * watch history or recommendation data from appearing after logout.
     */
    logout() {
      const historyStore = useHistoryStore()
      const recommendationsStore = useRecommendationsStore()
      this.user = null
      this.token = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      historyStore.clearState()
      recommendationsStore.clear()
    },
  },
})
