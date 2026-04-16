<template>
  <div class="app-shell">
    <AnimatedBackground />
    <NavBar />
    <main class="app-main">
      <!-- Route views render inside the shared app chrome. -->
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import AnimatedBackground from './components/layout/AnimatedBackground.vue'
import NavBar from './components/layout/NavBar.vue'
</script>
