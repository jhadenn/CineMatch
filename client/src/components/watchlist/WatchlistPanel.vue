<template>
  <section class="space-y-3 sm:space-y-4">
    <WatchlistItem
      v-for="(item, index) in items"
      :key="item.id"
      :item="item"
      :is-first="index === 0"
      :is-last="index === items.length - 1"
      :is-marking-watched="markingItemIds.includes(item.id)"
      @remove="$emit('remove', item.id)"
      @move-up="$emit('move-item', index, index - 1)"
      @move-down="$emit('move-item', index, index + 1)"
      @mark-watched="$emit('mark-watched', item)"
    />
  </section>
</template>

<script setup>
import WatchlistItem from './WatchlistItem.vue'

defineProps({
  items: { type: Array, required: true },
  markingItemIds: { type: Array, default: () => [] },
})

defineEmits(['remove', 'move-item', 'mark-watched'])
</script>
