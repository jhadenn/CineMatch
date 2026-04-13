<template>
  <div class="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-4 sm:p-5 shadow-lg shadow-black/20">
    <div class="flex items-center justify-between gap-3 mb-4">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Filters</p>
      <button
        v-if="hasActiveFilters"
        @click="$emit('clear')"
        class="px-3 py-1.5 text-xs text-violet-200 hover:text-white border border-violet-400/35 bg-violet-500/10 rounded-lg hover:bg-violet-500/20 transition-colors"
      >
        Clear all
      </button>
    </div>

    <!-- Genre chips -->
    <div class="flex flex-col gap-2">
      <label class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Genre</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition-all border"
          :class="filters.genre === null
            ? 'bg-violet-500/25 text-violet-100 border-violet-300/40 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]'
            : 'bg-black/25 text-gray-300 border-white/10 hover:border-violet-400/40 hover:text-violet-100'"
          @click="update('genre', null)"
        >
          All genres
        </button>
        <button
          v-for="g in genres"
          :key="g.id"
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition-all border"
          :class="filters.genre === g.id
            ? 'bg-violet-500/25 text-violet-100 border-violet-300/40 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]'
            : 'bg-black/25 text-gray-300 border-white/10 hover:border-violet-400/40 hover:text-violet-100'"
          @click="update('genre', g.id)"
        >
          {{ g.name }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
      <!-- Year from -->
      <div class="rounded-xl border border-white/10 bg-black/25 p-3 flex flex-col justify-center min-h-[96px]">
        <label class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">From year</label>
        <input
          type="number"
          :value="filters.yearFrom"
          @change="update('yearFrom', $event.target.value ? Number($event.target.value) : null)"
          placeholder="1900"
          min="1900"
          :max="currentYear"
          class="mt-2 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-violet-400/60"
        />
      </div>

      <!-- Year to -->
      <div class="rounded-xl border border-white/10 bg-black/25 p-3 flex flex-col justify-center min-h-[96px]">
        <label class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">To year</label>
        <input
          type="number"
          :value="filters.yearTo"
          @change="update('yearTo', $event.target.value ? Number($event.target.value) : null)"
          :placeholder="String(currentYear)"
          min="1900"
          :max="currentYear"
          class="mt-2 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-violet-400/60"
        />
      </div>

      <!-- Min rating slider -->
      <div class="rounded-xl border border-white/10 bg-black/25 p-3 flex flex-col justify-center min-h-[96px]">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Min rating</label>
          <span class="text-xs font-semibold text-violet-200">{{ filters.minRating }}</span>
        </div>
        <input
          type="range"
          :value="filters.minRating"
          @input="update('minRating', Number($event.target.value))"
          min="0"
          max="10"
          step="0.5"
          class="mt-3 w-full accent-violet-500"
        />
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filters: { type: Object, required: true },
  genres: { type: Array, default: () => [] },
})

const emit = defineEmits(['update', 'clear'])

const currentYear = new Date().getFullYear()

// The clear button should only appear when at least one filter changes the query.
const hasActiveFilters = computed(() => {
  const f = props.filters
  return f.genre || f.yearFrom || f.yearTo || f.minRating > 0
})

function update(key, value) {
  // Emit a partial patch object so the store can merge it with existing filters.
  emit('update', { [key]: value })
}
</script>
