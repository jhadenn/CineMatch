<template>
  <section class="space-y-3 sm:space-y-4">
    <WatchlistItem
      v-for="(item, index) in items"
      :key="item.id"
      :item="item"
      :is-first="index === 0"
      :is-last="index === items.length - 1"
      @remove="$emit('remove', item.id)"
      @move-up="$emit('move-item', index, index - 1)"
      @move-down="$emit('move-item', index, index + 1)"
    />
  </section>
</template>

<script setup>
import WatchlistItem from './WatchlistItem.vue'

defineProps({
  items: { type: Array, required: true },
})

defineEmits(['remove', 'move-item'])
</script>
