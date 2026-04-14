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

defineProps({
  items: { type: Array, required: true },
  removingItemIds: { type: Array, default: () => [] },
})

defineEmits(['remove'])
</script>
