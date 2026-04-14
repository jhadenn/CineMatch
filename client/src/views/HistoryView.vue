<template>
  <div class="min-h-[calc(100vh-72px)] bg-gray-950">
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <header class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Your Watch History</h1>
          <p class="mt-2 text-gray-400">Movies that are currently shaping your recommendations.</p>
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17h6M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-white">No watch history yet</h2>
        <p class="mt-2 text-gray-400">Mark saved movies as watched and they will show up here.</p>
        <RouterLink
          to="/watchlist"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-white hover:bg-[#6d28d9] transition-colors"
        >
          Go to Watchlist
          <span aria-hidden="true">&rarr;</span>
        </RouterLink>
      </div>

      <div v-else>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="text-sm text-gray-400">{{ items.length }} watched {{ items.length === 1 ? 'movie' : 'movies' }}</div>
          <RouterLink
            to="/recommendations"
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-violet-500/20 border border-violet-400/40 text-violet-200 hover:bg-violet-500/30 transition-colors"
          >
            View Recommendations
            <span aria-hidden="true">&rarr;</span>
          </RouterLink>
        </div>
        <p v-if="store.error" class="mb-4 text-sm text-red-300">{{ store.error }}</p>
        <HistoryPanel
          :items="items"
          :removing-item-ids="store.removingItemIds"
          @remove="removeItem"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useHistoryStore } from '../stores/history.js'
import HistoryPanel from '../components/history/HistoryPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const store = useHistoryStore()

// Keep sorting/formatting decisions in the store so the view only consumes
// render-ready data.
const items = computed(() => store.sortedItems)

onMounted(() => {
  // History is an authenticated page, so validate auth before loading data.
  authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // `initialize()` avoids duplicate fetches if the user revisits this route.
  store.initialize()
})

function removeItem(itemId) {
  // Delegate deletion to the store so it can also refresh recommendations.
  store.removeItem(itemId)
}
</script>
