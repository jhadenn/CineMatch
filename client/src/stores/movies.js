import { defineStore } from 'pinia'
import { searchMovies, getTrending, discoverMovies, getGenres } from '../services/tmdb.js'

/**
 * Filters influence both search and browse mode, so this helper is reused by
 * the store and by the client-side search-result filter.
 */
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
      ? parseInt(movie.release_date.substring(0, 4), 10)
      : null
    if (yearFrom && (!year || year < yearFrom)) return false
    if (yearTo && (!year || year > yearTo)) return false
    if (minRating && (movie.vote_average || 0) < minRating) return false

    return true
  })
}

function mergeUniqueMovies(existingMovies, incomingMovies) {
  const existingIds = new Set(existingMovies.map(movie => movie.id))
  return [
    ...existingMovies,
    ...incomingMovies.filter(movie => !existingIds.has(movie.id)),
  ]
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
    totalPages: 1,
    totalResults: 0,
    hasMore: true,
    loading: false,
  }),

  getters: {
    // Browse mode already loads the correct list from either `trending` or
    // `discover`, so no extra client-side filtering is needed here.
    trending(state) {
      return state._trending
    },
    // Search mode applies extra client-side filters because TMDB's text-search
    // endpoint does not accept genre/year/rating parameters.
    searchResults(state) {
      return filterMovies(state._searchResults, state.filters)
    },
  },

  actions: {
    async fetchGenres() {
      // Genre metadata is effectively static for a session, so cache it.
      if (this.genres.length) return
      const data = await getGenres()
      this.genres = data.genres || []
    },

    async searchMovies(query, page = 1) {
      // A fresh search always restarts pagination from page 1.
      this.query = query
      this.currentPage = page
      this.loading = true
      try {
        const data = await searchMovies(query, page)
        this._searchResults = data.results || []
        this.totalResults = data.total_results || 0
        this.totalPages = data.total_pages || 1
        this.hasMore = data.page < data.total_pages
      } finally {
        this.loading = false
      }
    },

    async loadTrending(page = 1) {
      // Browse mode uses `discover` only when filters are active; otherwise it
      // shows the TMDB weekly trending feed.
      this.currentPage = page
      this.loading = true
      try {
        const data = hasActiveFilters(this.filters)
          ? await discoverMovies(this.filters, page)
          : await getTrending(page)
        this._trending = data.results || []
        this.totalResults = data.total_results || 0
        this.totalPages = data.total_pages || 1
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
        // Decide which endpoint to paginate based on the active UI mode.
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
          this._searchResults = mergeUniqueMovies(this._searchResults, newMovies)
        } else {
          this._trending = mergeUniqueMovies(this._trending, newMovies)
        }
        this.totalPages = data.total_pages || this.totalPages
        this.hasMore = data.page < data.total_pages
      } finally {
        this.loading = false
      }
    },

    async goToPage(page) {
      if (this.loading) return
      if (page < 1 || page > this.totalPages) return

      if (this.query.trim()) {
        await this.searchMovies(this.query, page)
      } else {
        await this.loadTrending(page)
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      if (this.query.trim()) {
        // Search mode re-fetches page 1 so client-side filters apply to a fresh
        // unpaginated base result set.
        this.searchMovies(this.query)
      } else {
        // Browse mode reloads via discover, or trending if filters are cleared.
        this.loadTrending()
      }
    },

    clearSearch() {
      // Reset back to the browse-mode baseline.
      this.query = ''
      this._searchResults = []
      this.currentPage = 1
      this.totalPages = 1
      this.totalResults = 0
      this.hasMore = true
      this.filters = { genre: null, yearFrom: null, yearTo: null, minRating: 0 }
    },
  },
})
