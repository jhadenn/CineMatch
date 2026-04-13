<template>
  <article class="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 hover:border-violet-400/40 transition-colors">
    <img
      v-if="poster"
      :src="poster"
      :alt="item.title"
      class="h-20 w-14 sm:h-24 sm:w-16 rounded-lg object-cover border border-white/10"
      loading="lazy"
    />
    <div
      v-else
      class="h-20 w-14 sm:h-24 sm:w-16 rounded-lg bg-black/35 border border-white/10 flex items-center justify-center text-gray-500"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
      </svg>
    </div>

    <div class="min-w-0 flex-1">
      <RouterLink :to="`/movie/${item.tmdb_id}`" class="text-white font-semibold hover:text-violet-300 transition-colors line-clamp-1">
        {{ item.title }}
      </RouterLink>
      <div class="mt-1 text-sm text-gray-400 flex items-center gap-3">
        <span>{{ releaseYear }}</span>
        <span v-if="rating !== 'N/A'" class="inline-flex items-center gap-1 text-yellow-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {{ rating }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 hover:text-white hover:border-violet-400/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="isFirst"
        aria-label="Move up"
        @click="$emit('move-up')"
      >
        ↑
      </button>
      <button
        type="button"
        class="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 hover:text-white hover:border-violet-400/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="isLast"
        aria-label="Move down"
        @click="$emit('move-down')"
      >
        ↓
      </button>
      <button
        type="button"
        class="h-8 w-8 rounded-lg border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition-colors"
        aria-label="Remove from watchlist"
        @click="$emit('remove')"
      >
        ×
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { posterUrl } from '../../services/tmdb.js'

const props = defineProps({
  item: { type: Object, required: true },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false },
})

defineEmits(['remove', 'move-up', 'move-down'])

const poster = computed(() => posterUrl(props.item.poster_path))
const releaseYear = computed(() => props.item.release_date?.substring(0, 4) || 'Unknown year')
const rating = computed(() =>
  props.item.vote_average ? Number(props.item.vote_average).toFixed(1) : 'N/A'
)
</script>
