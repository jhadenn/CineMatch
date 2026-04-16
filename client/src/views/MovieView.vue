<!--
  Movie detail page.
  Hydrates a TMDB movie by route id, then layers in CineMatch-specific state
  such as watchlist membership and personalized match percentage.
-->
<template>
  <div class="page-shell min-h-[calc(100vh-110px)]">
    <div v-if="error" class="section-stage-soft mx-auto max-w-3xl px-6 py-16 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4 h-16 w-16 text-[rgba(255,214,152,0.42)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 class="font-display text-2xl font-semibold text-white">Movie not found</h1>
      <p class="mt-2 text-[rgba(225,220,212,0.62)]">We couldn't find the movie you're looking for.</p>
      <RouterLink to="/" class="glass-button-primary mt-6 inline-flex px-5 py-3">
        Go back home
      </RouterLink>
    </div>

    <div v-else-if="loading" class="space-y-6">
      <div class="skeleton-panel h-[28rem]" />
      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div class="skeleton-panel h-64" />
        <div class="space-y-4">
          <div class="skeleton-panel h-24" />
          <div class="skeleton-panel h-24" />
          <div class="skeleton-panel h-24" />
        </div>
      </div>
    </div>

    <div v-else-if="movie" class="space-y-8">
      <section class="hero-stage relative">
        <div class="relative min-h-[30rem] overflow-hidden">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="movie.title"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div v-else class="absolute inset-0 bg-[rgba(255,255,255,0.05)]" />
          <div class="hero-overlay absolute inset-0" />
          <div class="hero-spotlight" />

          <div class="relative flex min-h-[30rem] flex-col justify-end px-5 py-8 sm:px-8 sm:py-10">
            <div class="max-w-4xl">
              <h1 class="font-display text-4xl font-semibold text-white lg:text-5xl">{{ movie.title }}</h1>
              <p v-if="movie.tagline" class="mt-3 text-lg italic text-[rgba(225,220,212,0.72)]">{{ movie.tagline }}</p>

              <div class="mt-5 flex flex-wrap items-center gap-3 text-sm text-[rgba(235,227,215,0.82)]">
                <span class="glass-pill px-3 py-1.5">{{ releaseYear }}</span>
                <span v-if="movie.runtime" class="glass-pill px-3 py-1.5">{{ formatRuntime(movie.runtime) }}</span>
                <span class="glass-pill px-3 py-1.5 uppercase">{{ movie.original_language }}</span>
                <span class="glass-pill px-3 py-1.5 text-[rgba(255,220,170,0.9)]">
                  <span class="mr-1 inline-block">&#9733;</span>
                  {{ movie.vote_average?.toFixed(1) }}
                </span>
                <span
                  v-if="matchBadge"
                  :class="['glass-pill px-3 py-1.5', matchBadge.tone]"
                  :title="`Based on your watch history and watchlist`"
                >
                  <span class="inline-block h-2 w-2 rounded-full" :class="matchBadge.dot" />
                  {{ matchBadge.label }}
                </span>
              </div>

              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="glass-button-primary px-5 py-3"
                  :disabled="isInWatchlist"
                  @click="addCurrentMovieToWatchlist"
                >
                  {{ isInWatchlist ? 'In watchlist' : '+ Add to watchlist' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <section class="space-y-6">
          <article class="section-stage-soft p-5 sm:p-6">
            <div v-if="movie.genres?.length" class="mb-4 flex flex-wrap gap-2">
              <RouterLink
                v-for="genre in movie.genres"
                :key="genre.id"
                :to="{ path: '/search', query: { genre: genre.id } }"
                class="glass-pill px-3 py-1.5 text-sm text-[rgba(255,244,224,0.78)]"
              >
                {{ genre.name }}
              </RouterLink>
            </div>

            <div v-if="movie.overview">
              <p class="section-kicker">Overview</p>
              <p class="mt-3 max-w-3xl text-[1.02rem] leading-8 text-[rgba(225,220,212,0.72)]">{{ movie.overview }}</p>
            </div>
          </article>

          <article class="section-stage-soft p-5 sm:p-6">
            <p class="section-kicker">Trailer</p>
            <div class="mt-4 max-w-3xl">
              <TrailerEmbed :videos="movie.videos?.results || []" />
            </div>
          </article>
        </section>

        <section class="space-y-6">
          <article v-if="movie.credits?.cast?.length" class="section-stage-soft p-5 sm:p-6">
            <p class="section-kicker">Cast</p>
            <div class="mt-4">
              <CastCarousel :cast="movie.credits.cast" />
            </div>
          </article>
        </section>
      </div>

      <section v-if="similarMovies.length" class="pt-2">
        <div class="mb-5">
          <p class="section-kicker">Queue next</p>
          <h2 class="mt-3 font-display text-2xl font-semibold text-white">More like this</h2>
        </div>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          <MovieCard v-for="m in similarMovies" :key="m.id" :movie="m" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMovieDetails } from '../services/tmdb.js'
import { getMovieMatch } from '../services/api.js'
import { useWatchlistStore } from '../stores/watchlist.js'
import { useHistoryStore } from '../stores/history.js'
import { useRecommendationsStore } from '../stores/recommendations.js'
import TrailerEmbed from '../components/movie/TrailerEmbed.vue'
import CastCarousel from '../components/movie/CastCarousel.vue'
import MovieCard from '../components/movie/MovieCard.vue'

const route = useRoute()
const router = useRouter()
const watchlistStore = useWatchlistStore()
const historyStore = useHistoryStore()
const recommendationsStore = useRecommendationsStore()
const movie = ref(null)
const loading = ref(true)
const error = ref(false)
const match = ref(null)

const heroImage = computed(() => {
  if (!movie.value) return null
  if (movie.value.backdrop_path) return `https://image.tmdb.org/t/p/w1280${movie.value.backdrop_path}`
  if (movie.value.poster_path) return `https://image.tmdb.org/t/p/w1280${movie.value.poster_path}`
  return null
})

const releaseYear = computed(() =>
  movie.value?.release_date ? movie.value.release_date.substring(0, 4) : '--'
)

const similarMovies = computed(() =>
  (movie.value?.similar?.results || []).slice(0, 12)
)
const isInWatchlist = computed(() => {
  if (!movie.value?.id) return false
  return watchlistStore.items.some(item => Number(item.tmdb_id) === Number(movie.value.id))
})

const matchBadge = computed(() => {
  const percent = match.value?.percent
  if (!Number.isFinite(percent)) return null

  if (percent >= 80) {
    return {
      label: `${percent}% Match for you`,
      tone: 'border-[rgba(110,231,183,0.22)] bg-[rgba(110,231,183,0.12)] text-[#d1fae5]',
      dot: 'bg-[#a7f3d0]',
    }
  }
  if (percent >= 55) {
    return {
      label: `${percent}% Match for you`,
      tone: 'border-[rgba(245,180,79,0.3)] bg-[rgba(245,180,79,0.14)] text-[#fff0d0]',
      dot: 'bg-[#ffd89d]',
    }
  }
  return {
    label: `${percent}% Match for you`,
    tone: 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,244,224,0.78)]',
    dot: 'bg-[rgba(255,244,224,0.72)]',
  }
})

function formatRuntime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

async function fetchMatchFor(id) {
  // Match scoring is authenticated and optional; failures should not block the detail page.
  match.value = null
  const token = localStorage.getItem('token')
  if (!token || !id) return
  try {
    match.value = await getMovieMatch(id)
  } catch {
    match.value = null
  }
}

async function fetchMovie(id) {
  loading.value = true
  error.value = false
  movie.value = null
  match.value = null
  try {
    movie.value = await getMovieDetails(id)
    await watchlistStore.initialize()
    await historyStore.initialize()
    fetchMatchFor(id)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => [watchlistStore.items.length, historyStore.items.length, recommendationsStore.lastToken],
  () => {
    // Watchlist/history changes alter the taste profile, so refresh the pill.
    if (movie.value?.id) fetchMatchFor(movie.value.id)
  }
)

async function addCurrentMovieToWatchlist() {
  if (!movie.value) return
  const result = await watchlistStore.addMovie(movie.value)
  if (result?.reason === 'unauthorized') {
    router.push('/login')
  }
}

watch(() => route.params.id, (id) => {
  if (id) {
    fetchMovie(id)
    window.scrollTo(0, 0)
  }
}, { immediate: true })
</script>
