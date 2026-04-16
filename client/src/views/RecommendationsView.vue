<!-- Dedicated authenticated page for the shared recommendation feed component. -->
<template>
  <div class="page-shell min-h-[calc(100vh-110px)]">
    <div class="mb-6">
      <p class="section-kicker">For You</p>
      <h1 class="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">Your recommendation reel</h1>
      <p class="mt-2 text-sm text-[rgba(225,220,212,0.62)]">Movies picked from what you've watched and saved.</p>
    </div>

    <RecoFeed :limit="20" title="Your Recommendations" />
  </div>
</template>

<script setup>
import RecoFeed from '../components/recommendations/RecoFeed.vue'
</script>
