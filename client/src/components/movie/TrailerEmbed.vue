<template>
  <div v-if="trailerKey" class="media-frame aspect-video overflow-hidden">
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
    class="glass-panel-soft aspect-video flex flex-col items-center justify-center text-[rgba(188,176,160,0.58)]"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="mb-2 h-12 w-12 text-[rgba(255,214,152,0.42)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <p class="text-sm text-[rgba(225,220,212,0.64)]">No trailer available</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  videos: { type: Array, default: () => [] },
})

const trailerKey = computed(() => {
  // Prefer the official YouTube trailer when TMDB returns multiple video types.
  const trailer = props.videos.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  )
  return trailer?.key ?? null
})
</script>
