<template>
  <article class="group rounded-[30px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] transition-colors hover:border-amber-400/25 sm:p-5">
    <div class="flex flex-col gap-4 md:flex-row md:items-stretch">
      <div class="flex flex-shrink-0 gap-4">
        <img
          v-if="poster"
          :src="poster"
          :alt="item.title"
          class="h-32 w-24 rounded-2xl border border-white/10 object-cover sm:h-36 sm:w-28"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-32 w-24 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-zinc-500 sm:h-36 sm:w-28"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <RouterLink
              :to="`/movie/${item.tmdb_id}`"
              class="line-clamp-2 text-2xl font-semibold tracking-tight text-white transition-colors hover:text-amber-200"
            >
              {{ item.title }}
            </RouterLink>

            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-400">
              <span>{{ releaseYear }}</span>
              <span aria-hidden="true" class="text-zinc-600">&middot;</span>
              <span>{{ runtimeLabel }}</span>
              <span aria-hidden="true" class="text-zinc-600">&middot;</span>
              <span class="inline-flex items-center gap-1 text-amber-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ ratingLabel }}
              </span>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="genre in genres"
                :key="`${item.id}-${genre}`"
                class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
              >
                {{ genre }}
              </span>
              <span
                v-if="!genres.length"
                class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-500"
              >
                Genres unavailable
              </span>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
              <span>Added {{ addedLabel }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 md:flex-col md:items-end">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/12 text-emerald-200 transition-colors hover:bg-emerald-500/22 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isMarkingWatched"
              :title="isMarkingWatched ? 'Marking as watched' : 'Mark watched'"
              aria-label="Mark watched"
              @click="$emit('mark-watched')"
            >
              <svg v-if="!isMarkingWatched" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v4m0 8v4m8-8h-4M8 12H4m11.314-5.314l-2.828 2.828m-1.972 4.458l-2.828 2.828m0-9.114L4.858 4.858m14.284 14.284l-2.828-2.828" />
              </svg>
            </button>

            <div class="flex items-center gap-2 opacity-70 md:flex-col">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                :disabled="isFirst || isMarkingWatched"
                title="Move up"
                aria-label="Move up"
                @click="$emit('move-up')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                :disabled="isLast || isMarkingWatched"
                title="Move down"
                aria-label="Move down"
                @click="$emit('move-down')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-200 transition-colors hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isMarkingWatched"
              title="Remove from watchlist"
              aria-label="Remove from watchlist"
              @click="$emit('remove')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12m-9 0V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6M5 7l1 12a1 1 0 001 1h10a1 1 0 001-1l1-12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { posterUrl } from '../../services/tmdb.js'
import { formatRating, formatRuntimeShort } from '../../utils/formatters.js'

const props = defineProps({
  item: { type: Object, required: true },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false },
  isMarkingWatched: { type: Boolean, default: false },
})

defineEmits(['remove', 'move-up', 'move-down', 'mark-watched'])

const poster = computed(() => posterUrl(props.item.poster_path))

const releaseYear = computed(() => {
  const explicitYear = Number.parseInt(props.item.release_year, 10)
  if (Number.isFinite(explicitYear)) return String(explicitYear)

  const fallbackYear = typeof props.item.release_date === 'string'
    ? props.item.release_date.slice(0, 4)
    : ''
  return /^\d{4}$/.test(fallbackYear) ? fallbackYear : 'Year N/A'
})

const runtimeLabel = computed(() => formatRuntimeShort(props.item.runtime))
const ratingLabel = computed(() => formatRating(props.item.vote_average))

const genres = computed(() => {
  if (!Array.isArray(props.item.genres)) return []

  return props.item.genres
    .filter((genre) => typeof genre === 'string' && genre.trim())
    .map((genre) => genre.trim())
    .slice(0, 4)
})

const addedLabel = computed(() => {
  const parsed = Date.parse(props.item.added_at || '')
  if (!parsed) return 'recently'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
})

const queuePosition = computed(() => {
  const position = Number(props.item.position)
  return Number.isFinite(position) ? position + 1 : null
})
</script>
