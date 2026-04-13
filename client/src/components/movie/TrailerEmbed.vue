<template>
  <div v-if="trailerKey" class="aspect-video rounded-lg overflow-hidden">
    <iframe
      :src="`https://www.youtube-nocookie.com/embed/${trailerKey}`"
      title="Movie Trailer"
      class="w-full h-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
  </div>
  <div
    v-else
    class="aspect-video rounded-lg bg-gray-800 flex flex-col items-center justify-center text-gray-500"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <p class="text-sm">No trailer available</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  videos: { type: Array, default: () => [] },
})

const trailerKey = computed(() => {
  const trailer = props.videos.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  )
  return trailer?.key ?? null
})
</script>
