<template>
  <div class="max-w-7xl mx-auto px-4 py-10 min-h-[calc(100vh-72px)]">
    <div class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">For You</p>
      <p class="mt-2 text-sm text-gray-400">Movies picked from what you've watched and saved.</p>
    </div>

    <div class="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-3 sm:p-4">
      <RecoFeed :limit="20" title="Your Recommendations" />
    </div>
  </div>
</template>

<script setup>
import RecoFeed from '../components/recommendations/RecoFeed.vue'
</script>
