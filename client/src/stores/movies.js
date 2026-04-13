import { defineStore } from 'pinia'
import { searchMovies, getTrending, discoverMovies, getGenres } from '../services/tmdb.js'

function hasActiveFilters(filters) {
  return filters.genre || filters.yearFrom || filters.yearTo || filters.minRating > 0
}

// Client-side filter — only used for search results (TMDB search doesn't
// support genre / year / rating params).  Browse mode uses the discover
// endpoint which filters server-side.
function filterMovies(movies, filters) {
  if (!hasActiveFilters(filters)) return movies

  const { genre, yearFrom, yearTo, minRating } = filters
  return movies.filter(movie => {
    if (genre && !(movie.genre_ids || []).includes(genre)) return false

    const year = movie.release_date
      ? parseInt(movie.release_date.substring(0, 4))
      : null
    if (yearFrom && (!year || year < yearFrom)) return false
    if (yearTo && (!year || year > yearTo)) return false
    if (minRating && (movie.vote_average || 0) < minRating) return false

    return true
  })
}

export const useMoviesStore = defineStore('movies', {
  state: () => ({
    _trending: [],
    _searchResults: [],
    genres: [],
    query: '',
    filters: {
      genre: null,
      yearFrom: null,
      yearTo: null,
      minRating: 0,
    },
    currentPage: 1,
    totalResults: 0,
    hasMore: true,
    loading: false,
  }),

  getters: {
    // Browse mode: _trending already contains the right results
    // (either from trending or discover), no client-side filter needed.
    trending(state) {
      return state._trending
    },
    // Search mode: apply client-side filters since TMDB search
    // doesn't support genre/year/rating params.
    searchResults(state) {
      return filterMovies(state._searchResults, state.filters)
    },
  },

  actions: {
    async fetchGenres() {
      if (this.genres.length) return
      const data = await getGenres()
      this.genres = data.genres || []
    },

    async searchMovies(query) {
      this.query = query
      this.currentPage = 1
      this.loading = true
      try {
        const data = await searchMovies(query, 1)
        this._searchResults = data.results || []
        this.totalResults = data.total_results || 0
        this.hasMore = data.page < data.total_pages
      } finally {
        this.loading = false
      }
    },

    async loadTrending() {
      this.currentPage = 1
      this.loading = true
      try {
        const data = hasActiveFilters(this.filters)
          ? await discoverMovies(this.filters, 1)
          : await getTrending(1)
        this._trending = data.results || []
        this.totalResults = data.total_results || 0
        this.hasMore = data.page < data.total_pages
      } finally {
        this.loading = false
      }
    },

    async loadMore() {
      if (this.loading || !this.hasMore) return
      this.currentPage++
      this.loading = true
      try {
        const isSearch = this.query.trim().length > 0
        let data
        if (isSearch) {
          data = await searchMovies(this.query, this.currentPage)
        } else if (hasActiveFilters(this.filters)) {
          data = await discoverMovies(this.filters, this.currentPage)
        } else {
          data = await getTrending(this.currentPage)
        }

        const newMovies = data.results || []
        if (isSearch) {
          const existing = new Set(this._searchResults.map(m => m.id))
          this._searchResults = [
            ...this._searchResults,
            ...newMovies.filter(m => !existing.has(m.id)),
          ]
        } else {
          const existing = new Set(this._trending.map(m => m.id))
          this._trending = [
            ...this._trending,
            ...newMovies.filter(m => !existing.has(m.id)),
          ]
        }
        this.hasMore = data.page < data.total_pages
      } finally {
        this.loading = false
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      if (this.query.trim()) {
        // Search mode: re-run the search so the client-side getter
        // filters against a fresh page-1 result set.
        this.searchMovies(this.query)
      } else {
        // Browse mode: reload via discover (or trending if no filters).
        this.loadTrending()
      }
    },

    clearSearch() {
      this.query = ''
      this._searchResults = []
      this.currentPage = 1
      this.totalResults = 0
      this.hasMore = true
      this.filters = { genre: null, yearFrom: null, yearTo: null, minRating: 0 }
    },
  },
})
