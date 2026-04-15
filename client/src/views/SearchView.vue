<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pb-14 min-h-[calc(100vh-72px)]">
    <div class="mb-7">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">Discover</p>
      <h1 class="mt-2 text-3xl sm:text-4xl font-bold text-white tracking-tight">Find your next watch</h1>
      <p class="mt-2 text-sm text-gray-400">Search, filter, and jump through pages with a cleaner browsing flow.</p>
    </div>

    <!-- Search + Filters -->
    <div class="flex flex-col lg:flex-row gap-4 mb-6">
      <div class="flex-1">
        <SearchBar v-model="searchQuery" placeholder="Search for movies..." @search="onSearch" />
      </div>
    </div>

    <!-- Filter panel -->
    <div class="mb-7">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-white">Filters</h2>
          <p class="text-sm text-gray-400">Narrow the catalog by genre, year, and rating.</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition-colors hover:border-violet-400/45 hover:bg-violet-500/20"
          :aria-expanded="filtersOpen ? 'true' : 'false'"
          @click="toggleFilters"
        >
          {{ filtersOpen ? 'Hide Filters' : 'Show Filters' }}
        </button>
      </div>

      <div ref="filtersPanelRef" class="overflow-hidden">
        <FilterPanel
          :filters="store.filters"
          :genres="store.genres"
          @update="onFilterUpdate"
          @clear="onClearFilters"
        />
      </div>
    </div>

    <!-- Result count -->
    <div v-if="searchQuery.trim()" class="mb-5 text-sm text-gray-400">
      {{ resultText }}
    </div>
    <div v-else class="mb-5">
      <h2 class="text-2xl font-bold text-white">Trending This Week</h2>
    </div>

    <!-- Results grid -->
    <MovieGrid
      :movies="displayedMovies"
      :loading="store.loading"
      :enable-infinite-scroll="false"
    />

    <div v-if="showPagination" class="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:border-violet-400/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="store.currentPage === 1 || store.loading"
        @click="goToPage(store.currentPage - 1)"
      >
        Prev
      </button>

      <button
        v-for="page in pageNumbers"
        :key="page"
        type="button"
        class="min-w-9 h-9 rounded-lg border text-sm font-medium transition-colors"
        :class="page === store.currentPage
          ? 'bg-violet-500/25 text-violet-100 border-violet-400/45'
          : 'border-white/10 text-gray-300 hover:text-white hover:border-violet-400/40'"
        :disabled="store.loading"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:border-violet-400/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="store.currentPage === store.totalPages || store.loading"
        @click="goToPage(store.currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import $ from 'jquery'
import { useRoute, useRouter } from 'vue-router'
import { useMoviesStore } from '../stores/movies.js'
import SearchBar from '../components/search/SearchBar.vue'
import FilterPanel from '../components/search/FilterPanel.vue'
import MovieGrid from '../components/movie/MovieGrid.vue'

const store = useMoviesStore()
const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const filtersOpen = ref(true)
const filtersPanelRef = ref(null)

// The page switches between browse-mode cards and search-mode cards based on
// whether the search box currently contains text.
const displayedMovies = computed(() =>
  searchQuery.value.trim() ? store.searchResults : store.trending
)

const resultText = computed(() => {
  const total = store.totalResults
  const q = searchQuery.value.trim()
  if (!q) return ''
  return `${total.toLocaleString()} results for "${q}"`
})
const showPagination = computed(() => displayedMovies.value.length > 0 && store.totalPages > 1)
const pageNumbers = computed(() => {
  const total = store.totalPages
  const current = store.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  return [...pages].filter(page => page >= 1 && page <= total).sort((a, b) => a - b)
})

onMounted(async () => {
  await store.fetchGenres()
  applyRouteState()
  await nextTick()
  if (filtersPanelRef.value) {
    $(filtersPanelRef.value).show()
  }
})

watch(searchQuery, (q) => {
  syncRouteQuery(q, store.filters.genre)
})

watch(() => store.filters.genre, (genre) => {
  syncRouteQuery(searchQuery.value, genre)
})

watch(
  () => [route.query.q, route.query.genre],
  () => {
    applyRouteState()
  }
)

function applyRouteState() {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const genre = parseGenreQuery(route.query.genre)
  const genreChanged = store.filters.genre !== genre

  searchQuery.value = q
  // If URL has no query text, force browse mode first so genre links always
  // fetch discover/trending results instead of filtering stale search results.
  if (!q.trim() && store.query.trim()) {
    store.clearSearch()
  }

  if (q.trim()) {
    if (genreChanged) {
      store.setFilters({ genre })
      return
    }
    if (store.query !== q || genreChanged || store._searchResults.length === 0) {
      store.searchMovies(q)
    }
  } else {
    if (genreChanged) {
      store.setFilters({ genre })
      return
    }
    if (store._trending.length === 0 || store.filters.genre) {
      store.loadTrending()
    }
  }
}

function parseGenreQuery(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function syncRouteQuery(q, genre) {
  const nextQuery = {}
  const trimmed = q.trim()
  if (trimmed) nextQuery.q = trimmed
  if (genre) nextQuery.genre = String(genre)

  const currentQ = typeof route.query.q === 'string' ? route.query.q : ''
  const currentGenre = typeof route.query.genre === 'string' ? route.query.genre : ''
  const nextQ = nextQuery.q || ''
  const nextGenre = nextQuery.genre || ''
  if (currentQ === nextQ && currentGenre === nextGenre) return

  router.replace({ query: nextQuery })
}

function onSearch(query) {
  searchQuery.value = query
  if (query.trim()) {
    store.searchMovies(query)
  } else {
    // Returning to an empty search box means switching back to browse mode.
    store.clearSearch()
    if (store._trending.length === 0) store.loadTrending()
  }
}

function onFilterUpdate(updates) {
  store.setFilters(updates)
}

function onClearFilters() {
  store.setFilters({ genre: null, yearFrom: null, yearTo: null, minRating: 0 })
}

function toggleFilters() {
  filtersOpen.value = !filtersOpen.value

  const panel = filtersPanelRef.value
  if (!panel) return

  $(panel).stop(true, true)[filtersOpen.value ? 'slideDown' : 'slideUp'](180)
}

function goToPage(page) {
  store.goToPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
