<template>
  <div class="min-h-[calc(100vh-72px)] bg-gray-950">
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <header class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Your Watchlist</h1>
          <p class="mt-2 text-gray-400">Movies you want to watch, prioritized your way.</p>
        </div>
      </header>

      <div v-if="store.loading" class="space-y-3">
        <div
          v-for="n in 5"
          :key="n"
          class="h-24 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse"
        />
      </div>

      <div
        v-else-if="!items.length"
        class="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center"
      >
        <div class="mx-auto w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12a1 1 0 011 1v15l-7-3-7 3V5a1 1 0 011-1z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-white">Your watchlist is empty</h2>
        <p class="mt-2 text-gray-400">Start adding movies and they will show up here.</p>
        <RouterLink
          to="/search"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-white hover:bg-[#6d28d9] transition-colors"
        >
          Browse Movies
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div v-else>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="text-sm text-gray-400">{{ items.length }} saved {{ items.length === 1 ? 'movie' : 'movies' }}</div>
          <RouterLink
            to="/search"
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-violet-500/20 border border-violet-400/40 text-violet-200 hover:bg-violet-500/30 transition-colors"
          >
            Browse Movies
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
        <WatchlistPanel :items="items" @remove="removeItem" @move-item="moveItem" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useWatchlistStore } from '../stores/watchlist.js'
import WatchlistPanel from '../components/watchlist/WatchlistPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const store = useWatchlistStore()
const items = computed(() => store.sortedItems)

onMounted(() => {
  authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  store.initialize()
})

function removeItem(itemId) {
  store.removeItem(itemId)
}

function moveItem(from, to) {
  store.moveItem(from, to)
}
</script>
