<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Search bar -->
    <div class="max-w-2xl mx-auto mb-10">
      <SearchBar v-model="searchQuery" placeholder="Search for movies..." @search="onSearch" />
    </div>

    <!-- Trending section -->
    <h2 class="text-2xl font-bold text-white mb-6">Trending This Week</h2>
    <MovieGrid
      :movies="store.trending"
      :loading="store.loading"
      @load-more="loadMore"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMoviesStore } from '../stores/movies.js'
import SearchBar from '../components/search/SearchBar.vue'
import MovieGrid from '../components/movie/MovieGrid.vue'

const store = useMoviesStore()
const router = useRouter()
const searchQuery = ref('')

onMounted(() => {
  if (store._trending.length === 0) {
    store.loadTrending()
  }
})

function onSearch(query) {
  if (query.trim()) {
    router.push({ path: '/search', query: { q: query } })
  }
}

function loadMore() {
  if (!store.query.trim()) {
    store.loadMore()
  }
}
</script>
