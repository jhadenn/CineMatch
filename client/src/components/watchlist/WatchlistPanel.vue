<!--
  Thin list wrapper for watchlist rows.
  Supports drag-and-drop reordering as well as button-based move up/down.
  Each WatchlistItem stays focused on presenting one movie and its actions;
  this parent decides how each emitted or drag action is persisted.
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
      :is-drag-over="dragOverIndex === index"
      draggable="true"
      @dragstart="onDragStart(index, $event)"
      @dragover.prevent="onDragOver(index)"
      @dragleave="onDragLeave(index)"
      @drop.prevent="onDrop(index)"
      @dragend="onDragEnd"
      @remove="$emit('remove', item.id)"
      @move-up="$emit('move-item', index, index - 1)"
      @move-down="$emit('move-item', index, index + 1)"
      @mark-watched="$emit('mark-watched', item)"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import WatchlistItem from './WatchlistItem.vue'

defineProps({
  items: { type: Array, required: true },
  markingItemIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['remove', 'move-item', 'mark-watched'])

const dragFromIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(index, event) {
  dragFromIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(index) {
  dragOverIndex.value = index
}

function onDragLeave(index) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

function onDrop(index) {
  if (dragFromIndex.value !== null && dragFromIndex.value !== index) {
    emit('move-item', dragFromIndex.value, index)
  }
  dragFromIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragFromIndex.value = null
  dragOverIndex.value = null
}
</script>
