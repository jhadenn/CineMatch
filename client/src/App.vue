<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <NavBar />
    <main>
      <!-- Route views render inside the shared app chrome. -->
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import NavBar from './components/layout/NavBar.vue'
</script>
