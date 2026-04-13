<template>
  <nav class="sticky top-0 z-40 px-4 py-4 bg-gray-950/75 backdrop-blur-md border-b border-violet-500/15">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
      <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold text-violet-300 hover:text-violet-200 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
        <span class="hidden sm:inline">CineMatch</span>
      </RouterLink>

      <div class="hidden md:flex items-center gap-7 text-sm font-medium">
        <RouterLink to="/" class="text-gray-300 hover:text-white transition-colors" active-class="text-violet-300">
          Discover
        </RouterLink>
        <RouterLink to="/watchlist" class="text-gray-300 hover:text-white transition-colors" active-class="text-violet-300">
          Watchlist
        </RouterLink>
        <RouterLink to="/dashboard" class="text-gray-300 hover:text-white transition-colors" active-class="text-violet-300">
          Preferences
        </RouterLink>
      </div>

      <div class="flex items-center gap-3">
        <form
          class="hidden sm:flex items-center w-72 rounded-full bg-black/35 border border-white/10 px-3 py-2 text-gray-300 focus-within:border-violet-400/70 transition-colors"
          @submit.prevent="submitSearch"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search movies..."
            class="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
          />
        </form>

        <RouterLink
          to="/login"
          class="inline-flex items-center justify-center w-10 h-10 rounded-full text-white shadow-sm transition-colors bg-[#7c3aed] hover:bg-[#6d28d9]"
          aria-label="Account"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A10.963 10.963 0 0112 15c2.5 0 4.847.815 6.879 2.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

function submitSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
}
</script>
