<template>
  <section class="space-y-3 sm:space-y-4">
    <HistoryItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      :is-removing="removingItemIds.includes(item.id)"
      @remove="$emit('remove', item.id)"
    />
  </section>
</template>

<script setup>
import HistoryItem from './HistoryItem.vue'

// Thin list wrapper that owns list-level concerns while each row stays focused
// on rendering a single history entry.
defineProps({
  items: { type: Array, required: true },
  removingItemIds: { type: Array, default: () => [] },
})

// Bubble the selected id back to the parent view/store orchestration layer.
defineEmits(['remove'])
</script>
