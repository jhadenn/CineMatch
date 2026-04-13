import { defineStore } from 'pinia'

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    // Placeholder store shape until watchlist CRUD endpoints are implemented.
    items: [],
  }),
})
