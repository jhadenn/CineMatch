<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Search + Filters -->
    <div class="flex flex-col lg:flex-row gap-4 mb-8">
      <div class="flex-1">
        <SearchBar v-model="searchQuery" placeholder="Search for movies..." @search="onSearch" />
      </div>
    </div>

    <!-- Filter panel -->
    <div class="mb-6">
      <FilterPanel
        :filters="store.filters"
        :genres="store.genres"
        @update="onFilterUpdate"
        @clear="onClearFilters"
      />
    </div>

    <!-- Result count -->
    <div v-if="searchQuery.trim()" class="mb-4 text-sm text-gray-400">
      {{ resultText }}
    </div>
    <div v-else class="mb-4">
      <h2 class="text-2xl font-bold text-white">Trending This Week</h2>
    </div>

    <!-- Results grid -->
    <MovieGrid
      :movies="displayedMovies"
      :loading="store.loading"
      @load-more="loadMore"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMoviesStore } from '../stores/movies.js'
import SearchBar from '../components/search/SearchBar.vue'
import FilterPanel from '../components/search/FilterPanel.vue'
import MovieGrid from '../components/movie/MovieGrid.vue'

const store = useMoviesStore()
const route = useRoute()
const router = useRouter()
const searchQuery = ref('')

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

  const q = route.query.q || ''
  if (q) {
    searchQuery.value = q
    store.searchMovies(q)
  } else if (store._trending.length === 0) {
    store.loadTrending()
  }
})

watch(searchQuery, (q) => {
  const current = route.query.q || ''
  if (q !== current) {
    router.replace({ query: q.trim() ? { q } : {} })
  }
})

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

function loadMore() {
  store.loadMore()
}
</script>
