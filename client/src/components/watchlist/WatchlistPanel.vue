<!--
  Thin list wrapper for watchlist rows.
  It translates row positions into move events while each WatchlistItem stays
  focused on presenting one movie and its actions.
-->
<template>
  <section class="space-y-5">
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
