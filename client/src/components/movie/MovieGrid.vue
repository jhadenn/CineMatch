<template>
  <div>
    <!-- Skeleton loading state -->
    <div
      v-if="loading && movies.length === 0"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      <div
        v-for="n in 10"
        :key="n"
        class="rounded-lg overflow-hidden bg-gray-800"
      >
        <div class="aspect-[2/3] bg-gray-700 animate-pulse" />
        <div class="p-3 space-y-2">
          <div class="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
          <div class="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading && movies.length === 0"
      class="flex flex-col items-center justify-center py-20 text-gray-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p class="text-lg font-medium">No movies found</p>
      <p class="text-sm mt-1">Try adjusting your search or filters</p>
    </div>

    <!-- Movie grid -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
    </div>

    <!-- Bottom loading spinner for infinite scroll -->
    <div
      v-if="enableInfiniteScroll && loading && movies.length > 0"
      class="flex justify-center py-8"
    >
      <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
