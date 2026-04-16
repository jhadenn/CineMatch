<template>
  <div class="page-shell min-h-[calc(100vh-110px)]">
    <section class="section-stage overflow-hidden p-5 sm:p-6">
      <div class="flex flex-col gap-6">
        <div>
          <p class="section-kicker">Discover</p>
          <h1 class="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">Find your next watch</h1>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-[rgba(225,220,212,0.62)]">Search, filter, and keep scrolling through results without getting boxed into paged screens.</p>
        </div>

        <div class="max-w-3xl">
          <SearchBar v-model="searchQuery" placeholder="Search for movies..." @search="onSearch" />
        </div>
      </div>
    </section>

    <section class="mt-7">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-semibold text-white">Filters</h2>
          <p class="mt-1 text-sm text-[rgba(225,220,212,0.58)]">Narrow the catalog by genre, year, and rating.</p>
        </div>
        <button
          type="button"
          class="glass-button-secondary px-4 py-3 text-sm"
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
    </section>

    <div v-if="searchQuery.trim()" class="mt-6">
      <span class="glass-pill px-4 py-2 text-sm text-[rgba(255,244,224,0.82)]">{{ resultText }}</span>
    </div>
    <div v-else class="mt-8 mb-5">
      <p class="section-kicker">Trending</p>
      <h2 class="mt-3 font-display text-2xl font-semibold text-white">Trending This Week</h2>
      <p class="mt-2 text-sm text-[rgba(225,220,212,0.58)]">Fresh picks everyone is watching right now.</p>
    </div>

    <div class="mt-5">
      <MovieGrid
        :movies="displayedMovies"
        :loading="store.loading"
        @load-more="store.loadMore"
      />
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

const displayedMovies = computed(() =>
  searchQuery.value.trim() ? store.searchResults : store.trending
)

const resultText = computed(() => {
  const total = store.totalResults
  const q = searchQuery.value.trim()
  if (!q) return ''
  return `${total.toLocaleString()} results for "${q}"`
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
</script>
