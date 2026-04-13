<template>
  <div class="pb-14 min-h-[calc(100vh-72px)]">
    <section
      class="relative overflow-hidden min-h-[70vh] border-b border-gray-800"
      :style="heroStyle"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55" />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/40" />

      <div class="relative max-w-7xl mx-auto px-4 pt-6 pb-12 min-h-[70vh] flex flex-col">
        <div class="mt-auto max-w-2xl space-y-5">
          <span
            class="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold border"
            style="background-color: rgba(124, 58, 237, 0.2); color: #ddd6fe; border-color: rgba(124, 58, 237, 0.55);"
          >
            {{ matchLabel }}
          </span>

          <h1 class="text-4xl md:text-6xl font-bold text-white tracking-tight">
            {{ featuredMovie?.title || 'Featured Movie' }}
          </h1>

          <div class="flex flex-wrap items-center gap-3 text-gray-200">
            <span class="inline-flex items-center gap-1 text-yellow-400 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {{ ratingLabel }}
            </span>
            <span>{{ releaseYear }}</span>
            <span
              v-for="genre in featuredGenres"
              :key="genre"
              class="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-sm"
            >
              {{ genre }}
            </span>
          </div>

          <p class="text-gray-300 text-lg leading-relaxed max-w-xl line-clamp-3">
            {{ featuredMovie?.overview || 'Find your next favorite movie with personalized recommendations.' }}
          </p>

          <div class="flex flex-wrap gap-3">
            <RouterLink
              v-if="featuredMovie"
              :to="`/movie/${featuredMovie.id}`"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold transition-colors bg-[#7c3aed] hover:bg-[#6d28d9]"
            >
              <span class="text-xs">▶</span>
              Watch Trailer
            </RouterLink>
            <button
              v-if="featuredMovie"
              type="button"
              class="px-5 py-2.5 rounded-lg bg-white/10 text-white font-medium border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="isFeaturedInWatchlist"
              @click="addFeaturedToWatchlist"
            >
              {{ isFeaturedInWatchlist ? 'In Watchlist' : '+ Add to Watchlist' }}
            </button>
            <RouterLink
              v-if="featuredMovie"
              :to="`/movie/${featuredMovie.id}`"
              class="px-5 py-2.5 rounded-lg bg-black/40 text-white font-medium border border-white/20 hover:bg-black/60 transition-colors"
            >
              More Info
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 pt-10">
      <div class="mb-6">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">Browse</p>
        <h2 class="mt-2 text-2xl sm:text-3xl font-bold text-white">Trending This Week</h2>
        <p class="mt-2 text-sm text-gray-400">Fresh picks everyone is watching right now.</p>
      </div>

      <div class="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-3 sm:p-4">
      <MovieGrid
        :movies="store.trending"
        :loading="store.loading"
        :enable-infinite-scroll="false"
      />
      </div>

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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMoviesStore } from '../stores/movies.js'
import { useWatchlistStore } from '../stores/watchlist.js'
import { backdropUrl } from '../services/tmdb.js'
import MovieGrid from '../components/movie/MovieGrid.vue'

const store = useMoviesStore()
const watchlistStore = useWatchlistStore()
const router = useRouter()
const featuredMovieId = ref(null)

onMounted(async () => {
  // Preserve previously loaded browse results when the user navigates back home.
  if (store._trending.length === 0) {
    await store.loadTrending()
  }
  await watchlistStore.initialize()
  pickRandomFeaturedMovie()
  store.fetchGenres()
})

const featuredMovie = computed(() =>
  store.trending.find(movie => movie.id === featuredMovieId.value) || store.trending[0] || null
)
const heroStyle = computed(() => {
  const image = backdropUrl(featuredMovie.value?.backdrop_path)
  const fallback = 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #111827 100%)'
  return image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundImage: fallback }
})
const ratingLabel = computed(() => featuredMovie.value?.vote_average ? featuredMovie.value.vote_average.toFixed(1) : 'N/A')
const releaseYear = computed(() => featuredMovie.value?.release_date ? featuredMovie.value.release_date.substring(0, 4) : '—')
const featuredGenres = computed(() => {
  if (!featuredMovie.value?.genre_ids?.length || !store.genres.length) return []
  const lookup = new Map(store.genres.map(genre => [genre.id, genre.name]))
  return featuredMovie.value.genre_ids.map(id => lookup.get(id)).filter(Boolean).slice(0, 3)
})
const matchLabel = computed(() => {
  const score = featuredMovie.value?.vote_average ? Math.min(99, Math.round(featuredMovie.value.vote_average * 10)) : 95
  return `${score}% Match For You`
})
const showPagination = computed(() => store.trending.length > 0 && store.totalPages > 1)
const pageNumbers = computed(() => {
  const total = store.totalPages
  const current = store.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  return [...pages].filter(page => page >= 1 && page <= total).sort((a, b) => a - b)
})
const isFeaturedInWatchlist = computed(() => {
  if (!featuredMovie.value?.id) return false
  return watchlistStore.items.some(item => Number(item.tmdb_id) === Number(featuredMovie.value.id))
})

function pickRandomFeaturedMovie() {
  if (!store.trending.length) {
    featuredMovieId.value = null
    return
  }
  const randomIndex = Math.floor(Math.random() * store.trending.length)
  featuredMovieId.value = store.trending[randomIndex].id
}

function goToPage(page) {
  store.goToPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function addFeaturedToWatchlist() {
  if (!featuredMovie.value) return
  const result = await watchlistStore.addMovie(featuredMovie.value)
  if (result?.reason === 'unauthorized') {
    router.push('/login')
  }
}
</script>
