<template>
  <nav class="sticky top-0 z-40 px-3 py-3 sm:px-4 lg:px-6 bg-gray-950/75 backdrop-blur-md border-b border-violet-500/15">
    <div class="w-full flex items-center gap-3 sm:gap-4">
      <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold text-violet-300 hover:text-violet-200 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
        <span class="hidden sm:inline">CineMatch</span>
      </RouterLink>

      <div class="hidden md:flex items-center gap-2 lg:gap-3 text-xs lg:text-sm font-medium mx-auto">
        <RouterLink to="/" :class="navLinkClass(isDiscoverActive)">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h3a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm9 0a2 2 0 012-2h3a2 2 0 012 2v5a2 2 0 01-2 2h-3a2 2 0 01-2-2V6zm0 9a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z" />
          </svg>
          <span>Discover</span>
        </RouterLink>
        <RouterLink to="/watchlist" :class="navLinkClass(route.path.startsWith('/watchlist'))">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12a1 1 0 011 1v15l-7-3-7 3V5a1 1 0 011-1z" />
          </svg>
          <span>Watchlist</span>
        </RouterLink>
        <RouterLink to="/dashboard" :class="navLinkClass(route.path.startsWith('/dashboard'))">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="8" cy="6" r="2" fill="none" />
            <circle cx="16" cy="12" r="2" fill="none" />
            <circle cx="10" cy="18" r="2" fill="none" />
          </svg>
          <span>Preferences</span>
        </RouterLink>
      </div>

      <div class="flex items-center gap-3 ml-auto">
        <form
          class="hidden md:flex items-center w-[clamp(12rem,22vw,24rem)] rounded-full bg-black/35 border border-white/10 px-3 py-2 text-gray-300 focus-within:border-violet-400/70 transition-colors"
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
          class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white shadow-sm transition-colors bg-[#7c3aed] hover:bg-[#6d28d9]"
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const isDiscoverActive = computed(() => route.path === '/' || route.path.startsWith('/search') || route.path.startsWith('/movie/'))

function navLinkClass(isActive) {
  if (isActive) {
    return 'inline-flex items-center gap-2 rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 bg-violet-500/25 text-violet-200 border border-violet-400/35 transition-colors'
  }
  return 'inline-flex items-center gap-2 rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white transition-colors'
}

function submitSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
}
</script>
