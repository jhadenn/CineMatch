<template>
  <div class="page-shell min-h-[calc(100vh-110px)] pb-14">
    <section
      class="hero-stage relative min-h-[72vh] p-5 sm:p-7"
      :style="heroStyle"
    >
      <div class="hero-overlay absolute inset-0" />
      <div class="hero-spotlight" />

      <div class="relative flex min-h-[66vh] flex-col justify-end">
        <div class="max-w-2xl space-y-5">
          <span class="glass-pill glass-pill-active px-4 py-2 text-sm font-semibold">
            {{ matchLabel }}
          </span>

          <h1 class="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
            {{ featuredMovie?.title || 'Featured Movie' }}
          </h1>

          <div class="flex flex-wrap items-center gap-3 text-[rgba(235,227,215,0.82)]">
            <span class="inline-flex items-center gap-1 font-semibold text-[rgba(255,220,170,0.92)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {{ ratingLabel }}
            </span>
            <span>{{ releaseYear }}</span>
            <span
              v-for="genre in featuredGenres"
              :key="genre"
              class="glass-pill px-3 py-1.5 text-sm text-[rgba(255,244,224,0.78)]"
            >
              {{ genre }}
            </span>
          </div>

          <p class="max-w-xl text-lg leading-relaxed text-[rgba(235,227,215,0.72)]">
            {{ featuredMovie?.overview || 'Find your next favorite movie with personalized recommendations.' }}
          </p>

          <div class="flex flex-wrap gap-3">
            <button
              v-if="featuredMovie"
              type="button"
              class="glass-button-primary px-5 py-3"
              :disabled="trailerLoading"
              @click="openTrailerModal"
            >
              <span>{{ trailerLoading ? 'Loading trailer...' : 'Watch trailer' }}</span>
            </button>
            <button
              v-if="featuredMovie"
              type="button"
              class="glass-button-secondary px-5 py-3"
              :disabled="isFeaturedInWatchlist"
              @click="addFeaturedToWatchlist"
            >
              {{ isFeaturedInWatchlist ? 'In watchlist' : '+ Add to watchlist' }}
            </button>
            <RouterLink
              v-if="featuredMovie"
              :to="`/movie/${featuredMovie.id}`"
              class="glass-button-ghost px-5 py-3"
            >
              More info
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-10">
      <div class="mb-6">
        <p class="section-kicker">Browse</p>
        <h2 class="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">Trending This Week</h2>
        <p class="mt-2 text-sm text-[rgba(225,220,212,0.58)]">Fresh picks everyone is watching right now.</p>
      </div>

      <MovieGrid
        :movies="store.trending"
        :loading="store.loading"
        @load-more="store.loadMore"
      />
    </section>

    <template v-if="authStore.isAuthenticated">
      <section class="mt-12">
        <div class="mb-6">
          <p class="section-kicker">For You</p>
          <h2 class="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">Picked from your taste profile</h2>
        </div>
        <RecoFeed :limit="10" title="Recommended for You" />
      </section>
    </template>

    <div
      v-if="isTrailerModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,2,2,0.82)] px-4 backdrop-blur-md"
      @click.self="closeTrailerModal"
    >
      <div class="glass-modal w-full max-w-4xl p-4 sm:p-5">
        <div class="mb-3 flex items-center justify-between gap-4">
          <h3 class="truncate font-display text-lg font-semibold text-white sm:text-xl">{{ featuredMovie?.title }} Trailer</h3>
          <button
            type="button"
            class="icon-button h-10 w-10"
            @click="closeTrailerModal"
            aria-label="Close trailer"
          >
            <span class="text-lg leading-none">X</span>
          </button>
        </div>
        <TrailerEmbed :videos="trailerVideos" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMoviesStore } from '../stores/movies.js'
import { useWatchlistStore } from '../stores/watchlist.js'
import { useAuthStore } from '../stores/auth.js'
import { backdropUrl, getMovieDetails } from '../services/tmdb.js'
import MovieGrid from '../components/movie/MovieGrid.vue'
import TrailerEmbed from '../components/movie/TrailerEmbed.vue'
import RecoFeed from '../components/recommendations/RecoFeed.vue'

const store = useMoviesStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const router = useRouter()
const featuredMovieId = ref(null)
const isTrailerModalOpen = ref(false)
const trailerLoading = ref(false)
const trailerVideos = ref([])

onMounted(async () => {
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
const releaseYear = computed(() => featuredMovie.value?.release_date ? featuredMovie.value.release_date.substring(0, 4) : '--')
const featuredGenres = computed(() => {
  if (!featuredMovie.value?.genre_ids?.length || !store.genres.length) return []
  const lookup = new Map(store.genres.map(genre => [genre.id, genre.name]))
  return featuredMovie.value.genre_ids.map(id => lookup.get(id)).filter(Boolean).slice(0, 3)
})
const matchLabel = computed(() => {
  const score = featuredMovie.value?.vote_average ? Math.min(99, Math.round(featuredMovie.value.vote_average * 10)) : 95
  return `${score}% Match For You`
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

async function addFeaturedToWatchlist() {
  if (!featuredMovie.value) return
  const result = await watchlistStore.addMovie(featuredMovie.value)
  if (result?.reason === 'unauthorized') {
    router.push('/login')
  }
}

async function openTrailerModal() {
  if (!featuredMovie.value) return
  trailerLoading.value = true
  try {
    const details = await getMovieDetails(featuredMovie.value.id)
    trailerVideos.value = details?.videos?.results || []
    isTrailerModalOpen.value = true
  } finally {
    trailerLoading.value = false
  }
}

function closeTrailerModal() {
  isTrailerModalOpen.value = false
  trailerVideos.value = []
}
</script>
