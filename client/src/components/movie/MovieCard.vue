<template>
  <RouterLink
    :to="`/movie/${movie.id}`"
    class="group relative block rounded-xl overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800/95 border border-white/10 shadow-md hover:shadow-xl hover:-translate-y-0.5 hover:border-violet-400/35 transition-all duration-300"
  >
    <!-- Poster -->
    <div class="aspect-[2/3] overflow-hidden">
      <img
        v-if="poster"
        :src="poster"
        :alt="movie.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center bg-gray-700 text-gray-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
        <span class="text-xs">No poster</span>
      </div>
    </div>

    <!-- Hover overlay with overview -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
      <p class="text-sm text-gray-200 line-clamp-4 leading-relaxed">
        {{ movie.overview || 'No overview available.' }}
      </p>
    </div>

    <!-- Info bar -->
    <div class="p-3.5">
      <h3 class="text-sm font-semibold text-white truncate">{{ movie.title }}</h3>
      <div class="flex items-center justify-between mt-1.5 text-xs text-gray-400">
        <span>{{ releaseYear }}</span>
        <span class="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
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

// Keep the component presentation-only by deriving all display labels here.
const poster = computed(() => posterUrl(props.movie.poster_path))
const releaseYear = computed(() =>
  props.movie.release_date ? props.movie.release_date.substring(0, 4) : '—'
)
const rating = computed(() =>
  // TMDB may omit vote_average on edge-case records.
  props.movie.vote_average ? props.movie.vote_average.toFixed(1) : 'N/A'
)
</script>
