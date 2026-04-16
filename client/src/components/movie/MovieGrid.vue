<template>
  <div>
    <!-- Skeleton loading state -->
    <div
      v-if="loading && movies.length === 0"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <div
        v-for="n in 10"
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

    <!-- Empty state -->
    <div
      v-else-if="!loading && movies.length === 0"
      class="empty-state-panel flex flex-col items-center justify-center py-20 text-center text-[rgba(225,220,212,0.72)]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="mb-4 h-16 w-16 text-[rgba(255,214,152,0.42)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p class="font-display text-lg font-semibold text-white">No movies found</p>
      <p class="mt-1 text-sm text-[rgba(225,220,212,0.62)]">Try adjusting your search or filters.</p>
    </div>

    <!-- Movie grid -->
    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
    </div>

    <!-- Bottom loading spinner for infinite scroll -->
    <div
      v-if="enableInfiniteScroll && loading && movies.length > 0"
      class="flex justify-center py-8"
    >
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(245,180,79,0.38)] border-t-transparent" />
    </div>

    <!-- Scroll sentinel for IntersectionObserver -->
    <div v-if="enableInfiniteScroll" ref="sentinel" class="h-1" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import MovieCard from './MovieCard.vue'

const props = defineProps({
  movies: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  enableInfiniteScroll: { type: Boolean, default: true },
})

const emit = defineEmits(['load-more'])
const sentinel = ref(null)
let observer = null

onMounted(() => {
  if (!props.enableInfiniteScroll) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        emit('load-more')
      }
    },
    // Start loading before the user reaches the exact bottom of the grid.
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

// When the movie list changes (e.g. after a load finishes but filters still
// leave few results), re-trigger the observer so it fires again if the
// sentinel is still in view.
watch(() => props.movies.length, () => {
  if (!props.enableInfiniteScroll) return
  if (sentinel.value && observer) {
    observer.unobserve(sentinel.value)
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
