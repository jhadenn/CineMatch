<template>
  <!-- Error state -->
  <div v-if="error" class="max-w-7xl mx-auto px-4 py-20 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h1 class="text-2xl font-bold text-white mb-2">Movie not found</h1>
    <p class="text-gray-400 mb-6">We couldn't find the movie you're looking for.</p>
    <RouterLink to="/" class="inline-block px-5 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors">
      Go back home
    </RouterLink>
  </div>

  <!-- Loading skeleton -->
  <div v-else-if="loading" class="animate-pulse">
    <div class="h-[28rem] bg-gray-800" />
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div class="h-8 bg-gray-700 rounded w-1/3" />
      <div class="h-4 bg-gray-700 rounded w-2/3" />
      <div class="h-4 bg-gray-700 rounded w-1/2" />
      <div class="aspect-video bg-gray-700 rounded-lg" />
      <div class="flex gap-4">
        <div v-for="n in 6" :key="n" class="w-28 flex-shrink-0 space-y-2">
          <div class="aspect-[2/3] bg-gray-700 rounded-lg" />
          <div class="h-3 bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    </div>
  </div>

  <!-- Movie detail -->
  <div v-else-if="movie">
    <!-- Hero section -->
    <div class="relative h-[28rem] overflow-hidden">
      <img
        v-if="heroImage"
        :src="heroImage"
        :alt="movie.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div v-else class="absolute inset-0 bg-gray-800" />
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-gray-950/30" />

      <!-- Hero content -->
      <div class="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-10">
        <h1 class="text-4xl lg:text-5xl font-bold text-white mb-2">{{ movie.title }}</h1>
        <p v-if="movie.tagline" class="text-lg text-gray-300 italic mb-4">{{ movie.tagline }}</p>

        <!-- Metadata pills -->
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-gray-200">
            {{ releaseYear }}
          </span>
          <span v-if="movie.runtime" class="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-gray-200">
            {{ formatRuntime(movie.runtime) }}
          </span>
          <span class="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-gray-200 uppercase">
            {{ movie.original_language }}
          </span>
          <span class="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {{ movie.vote_average?.toFixed(1) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <!-- Genre tags -->
      <div v-if="movie.genres?.length" class="flex flex-wrap gap-2">
        <RouterLink
          v-for="genre in movie.genres"
          :key="genre.id"
          :to="{ path: '/search', query: { genre: genre.id } }"
          class="px-3 py-1 text-sm font-medium rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors"
        >
          {{ genre.name }}
        </RouterLink>
      </div>

      <!-- Overview -->
      <div v-if="movie.overview">
        <h2 class="text-xl font-semibold text-white mb-3">Overview</h2>
        <p class="text-gray-300 leading-relaxed max-w-3xl">{{ movie.overview }}</p>
      </div>

      <!-- Trailer -->
      <div>
        <h2 class="text-xl font-semibold text-white mb-3">Trailer</h2>
        <div class="max-w-3xl">
          <TrailerEmbed :videos="movie.videos?.results || []" />
        </div>
      </div>

      <!-- Cast -->
      <div v-if="movie.credits?.cast?.length">
        <h2 class="text-xl font-semibold text-white mb-3">Cast</h2>
        <CastCarousel :cast="movie.credits.cast" />
      </div>

      <!-- More Like This -->
      <div v-if="similarMovies.length">
        <h2 class="text-xl font-semibold text-white mb-3">More Like This</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MovieCard v-for="m in similarMovies" :key="m.id" :movie="m" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getMovieDetails } from '../services/tmdb.js'
import TrailerEmbed from '../components/movie/TrailerEmbed.vue'
import CastCarousel from '../components/movie/CastCarousel.vue'
import MovieCard from '../components/movie/MovieCard.vue'

const route = useRoute()
const movie = ref(null)
const loading = ref(true)
const error = ref(false)

const heroImage = computed(() => {
  if (!movie.value) return null
  // Prefer the wide backdrop for the hero, then fall back to the poster.
  if (movie.value.backdrop_path) return `https://image.tmdb.org/t/p/w1280${movie.value.backdrop_path}`
  if (movie.value.poster_path) return `https://image.tmdb.org/t/p/w1280${movie.value.poster_path}`
  return null
})

const releaseYear = computed(() =>
  movie.value?.release_date ? movie.value.release_date.substring(0, 4) : '—'
)

const similarMovies = computed(() =>
  (movie.value?.similar?.results || []).slice(0, 12)
)

function formatRuntime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

async function fetchMovie(id) {
  // Reset local state before each request so route changes show a clean loader.
  loading.value = true
  error.value = false
  movie.value = null
  try {
    movie.value = await getMovieDetails(id)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

// Re-run the fetch when the route changes so clicking "More Like This" cards
// updates the current detail page instead of forcing a full page reload.
watch(() => route.params.id, (id) => {
  if (id) {
    fetchMovie(id)
    window.scrollTo(0, 0)
  }
}, { immediate: true })
</script>
