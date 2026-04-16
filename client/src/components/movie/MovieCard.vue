<!--
  Reusable catalog/recommendation card.
  Normalizes the TMDB poster/rating/year fields into a compact linkable card
  that can be used by search, home, and recommendation grids.
-->
<template>
  <RouterLink
    :to="`/movie/${movie.id}`"
    class="glass-card group relative block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(245,180,79,0.22)] hover:shadow-[0_26px_70px_rgba(0,0,0,0.34)]"
  >
    <div class="relative media-frame aspect-[2/3] overflow-hidden rounded-none border-0 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(7,7,7,0.82)]">
      <img
        v-if="poster"
        :src="poster"
        :alt="movie.title"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full w-full flex-col items-center justify-center bg-[rgba(255,255,255,0.04)] text-[rgba(188,176,160,0.42)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
        <span class="text-xs">No poster</span>
      </div>

      <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(3,3,3,0.96)] via-[rgba(3,3,3,0.64)] to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p class="line-clamp-5 text-sm leading-relaxed text-[rgba(255,246,230,0.82)]">
          {{ movie.overview || 'No overview available.' }}
        </p>
      </div>
    </div>

    <div class="relative flex min-h-[5.75rem] flex-col justify-between p-4">
      <div class="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.14)] to-transparent" />
      <div class="mb-2 flex items-start justify-between gap-3">
        <h3 class="min-w-0 truncate font-display text-[1rem] font-semibold text-white">{{ movie.title }}</h3>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-xs text-[rgba(216,206,192,0.6)]">
        <span>{{ releaseYear }}</span>
        <span class="flex items-center gap-1 text-[rgba(255,220,170,0.9)]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {{ rating }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { posterUrl } from '../../services/tmdb.js'

const props = defineProps({
  movie: { type: Object, required: true },
})

const poster = computed(() => posterUrl(props.movie.poster_path))
const releaseYear = computed(() =>
  props.movie.release_date ? props.movie.release_date.substring(0, 4) : '--'
)
const rating = computed(() =>
  props.movie.vote_average ? props.movie.vote_average.toFixed(1) : 'N/A'
)
</script>
