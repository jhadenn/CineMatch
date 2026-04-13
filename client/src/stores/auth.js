import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // The auth flow is not wired yet, but centralizing shape here keeps future
    // UI bindings consistent once login/register land.
    user: null,
    token: null,
  }),
})
