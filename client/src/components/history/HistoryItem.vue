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
      <p class="mt-1 text-sm text-gray-400">Watched {{ watchedLabel }}</p>
      <div class="mt-1 flex flex-wrap items-center text-sm text-gray-400">
        <span
          v-for="(segment, index) in metadataSegments"
          :key="`${item.id}-${index}-${segment}`"
          class="inline-flex items-center"
        >
          <span v-if="index > 0" aria-hidden="true" class="mx-2 text-gray-600">&bull;</span>
          <span class="line-clamp-1">{{ segment }}</span>
        </span>
      </div>
    </div>

    <button
      type="button"
      class="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="isRemoving"
      @click="$emit('remove')"
    >
      {{ isRemoving ? 'Removing...' : 'Remove' }}
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { posterUrl } from '../../services/tmdb.js'

const props = defineProps({
  item: { type: Object, required: true },
  isRemoving: { type: Boolean, default: false },
})

defineEmits(['remove'])

// Keep the component presentation-only by deriving display labels from the
// normalized store item rather than mutating the source object.
const poster = computed(() => posterUrl(props.item.poster_path))

const releaseYear = computed(() => {
  const explicitYear = Number.parseInt(props.item.release_year, 10)
  return Number.isFinite(explicitYear) ? String(explicitYear) : 'Unknown year'
})

const genres = computed(() => {
  // The card only has room for a small amount of metadata, so cap the list.
  if (!Array.isArray(props.item.genres)) return []

  return props.item.genres
    .filter(genre => typeof genre === 'string' && genre.trim())
    .map(genre => genre.trim())
    .slice(0, 2)
})

const watchedLabel = computed(() => {
  // Fall back to a vague label when legacy rows do not have a parseable date.
  const parsed = Date.parse(props.item.watched_at || '')
  if (!parsed) return 'recently'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
})

// Join the compact metadata row in the template without leaking formatting
// concerns into the store.
const metadataSegments = computed(() => [releaseYear.value, ...genres.value].filter(Boolean))
</script>
