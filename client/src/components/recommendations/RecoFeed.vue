<template>
  <div>
    <div class="mb-4">
      <h2 class="font-display text-2xl font-bold text-white sm:text-3xl">{{ effectiveTitle }}</h2>
      <p v-if="statusText" class="mt-1 text-sm text-[rgba(225,220,212,0.58)]">{{ statusText }}</p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="store.loading && store.items.length === 0"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <div
        v-for="n in skeletonCount"
        :key="n"
        class="skeleton-panel overflow-hidden"
      >
        <div class="aspect-[2/3] border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]" />
        <div class="p-3 space-y-2">
          <div class="h-4 w-3/4 rounded-full bg-[rgba(255,255,255,0.08)]" />
          <div class="h-3 w-1/2 rounded-full bg-[rgba(255,255,255,0.06)]" />
        </div>
      </div>
    </div>

    <!-- Empty / cold-start state -->
    <div
      v-else-if="!store.loading && displayItems.length === 0"
      class="empty-state-panel flex flex-col items-center justify-center py-20 text-center text-[rgba(225,220,212,0.72)]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="mb-4 h-16 w-16 text-[rgba(255,214,152,0.42)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <p class="font-display text-lg font-semibold text-white">No recommendations yet</p>
      <p class="mt-1 text-sm text-[rgba(225,220,212,0.62)]">{{ emptyStateText }}</p>
    </div>

    <!-- Movie grid -->
    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <MovieCard v-for="movie in displayItems" :key="movie.tmdb_id || movie.id" :movie="normalizeForCard(movie)" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import MovieCard from '../movie/MovieCard.vue'
import { useRecommendationsStore } from '../../stores/recommendations.js'

const props = defineProps({
  limit: { type: Number, default: 20 },
  title: { type: String, default: 'Recommended for You' },
})

const store = useRecommendationsStore()

onMounted(() => {
  store.fetch()
})

const skeletonCount = computed(() => Math.min(props.limit, 10))

const displayItems = computed(() =>
  store.items.slice(0, props.limit)
)

const effectiveTitle = computed(() =>
  store.meta.mode === 'fallback' ? 'Popular Right Now' : props.title
)

const statusText = computed(() => {
  if (store.loading && store.items.length === 0) return ''
  if (store.error) return store.error
  if (store.meta.mode === 'cold_start') {
    return 'Save a few movies or mark them watched to unlock personalized recommendations.'
  }
  if (store.meta.mode === 'fallback') {
    return 'Personalized scoring is unavailable right now, so this list is using generic popular picks.'
  }
  return ''
})

const emptyStateText = computed(() => {
  if (store.error) {
    return 'Recommendations are unavailable right now. Try again in a moment.'
  }
  if (store.meta.mode === 'fallback') {
    return 'Popular picks are temporarily unavailable. Try again in a moment.'
  }
  return 'Save a few movies or mark them watched to unlock personalized recommendations.'
})

function normalizeForCard(movie) {
  return {
    id: movie.tmdb_id || movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    overview: movie.overview,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  }
}
</script>
