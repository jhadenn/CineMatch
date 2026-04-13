<template>
  <div class="flex flex-wrap items-end gap-4">
    <!-- Genre dropdown -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">Genre</label>
      <select
        :value="filters.genre ?? ''"
        @change="update('genre', $event.target.value ? Number($event.target.value) : null)"
        class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All genres</option>
        <option v-for="g in genres" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
    </div>

    <!-- Year from -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">From year</label>
      <input
        type="number"
        :value="filters.yearFrom"
        @change="update('yearFrom', $event.target.value ? Number($event.target.value) : null)"
        placeholder="1900"
        min="1900"
        :max="currentYear"
        class="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- Year to -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">To year</label>
      <input
        type="number"
        :value="filters.yearTo"
        @change="update('yearTo', $event.target.value ? Number($event.target.value) : null)"
        :placeholder="String(currentYear)"
        min="1900"
        :max="currentYear"
        class="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- Min rating slider -->
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Min rating: {{ filters.minRating }}
      </label>
      <input
        type="range"
        :value="filters.minRating"
        @input="update('minRating', Number($event.target.value))"
        min="0"
        max="10"
        step="0.5"
        class="w-32 accent-indigo-500"
      />
    </div>

    <!-- Clear filters -->
    <button
      v-if="hasActiveFilters"
      @click="$emit('clear')"
      class="px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
    >
      Clear filters
    </button>
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

const hasActiveFilters = computed(() => {
  const f = props.filters
  return f.genre || f.yearFrom || f.yearTo || f.minRating > 0
})

function update(key, value) {
  emit('update', { [key]: value })
}
</script>
