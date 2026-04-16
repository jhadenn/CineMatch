<template>
  <div class="section-stage-soft p-4 sm:p-5">
    <div class="flex items-center justify-between gap-3 mb-4">
      <p class="panel-label">Filters</p>
      <button
        v-if="hasActiveFilters"
        @click="$emit('clear')"
        class="glass-button-ghost px-3 py-2 text-xs"
      >
        Clear all
      </button>
    </div>

    <!-- Genre chips -->
    <div class="flex flex-col gap-2">
      <label class="panel-label text-[11px]">Genre</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="filter-chip text-xs font-medium"
          :class="filters.genre === null
            ? 'filter-chip-active'
            : ''"
          @click="update('genre', null)"
        >
          All genres
        </button>
        <button
          v-for="g in genres"
          :key="g.id"
          type="button"
          class="filter-chip text-xs font-medium"
          :class="filters.genre === g.id
            ? 'filter-chip-active'
            : ''"
          @click="update('genre', g.id)"
        >
          {{ g.name }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
      <!-- Year from -->
      <div class="glass-panel-soft flex min-h-[96px] flex-col justify-center p-3">
        <label class="panel-label text-[11px]">From year</label>
        <input
          type="number"
          :value="filters.yearFrom"
          @change="update('yearFrom', $event.target.value ? Number($event.target.value) : null)"
          placeholder="1900"
          min="1900"
          :max="currentYear"
          class="glass-input mt-2 rounded-xl px-3 py-2 text-sm"
        />
      </div>

      <!-- Year to -->
      <div class="glass-panel-soft flex min-h-[96px] flex-col justify-center p-3">
        <label class="panel-label text-[11px]">To year</label>
        <input
          type="number"
          :value="filters.yearTo"
          @change="update('yearTo', $event.target.value ? Number($event.target.value) : null)"
          :placeholder="String(currentYear)"
          min="1900"
          :max="currentYear"
          class="glass-input mt-2 rounded-xl px-3 py-2 text-sm"
        />
      </div>

      <!-- Min rating slider -->
      <div class="glass-panel-soft flex min-h-[96px] flex-col justify-center p-3">
        <div class="flex items-center justify-between">
          <label class="panel-label text-[11px]">Min rating</label>
          <span class="text-xs font-semibold text-accent">{{ filters.minRating }}</span>
        </div>
        <input
          type="range"
          :value="filters.minRating"
          @input="update('minRating', Number($event.target.value))"
          min="0"
          max="10"
          step="0.5"
          class="mt-3 w-full accent-[#f5b44f]"
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
