<template>
  <div class="min-h-[calc(100vh-72px)] bg-[#050505]">
    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {{ isHistoryView ? 'Watch History' : 'My Watchlist' }}
          </h1>
          <p class="mt-2 text-sm text-zinc-400 sm:text-base">
            {{ isHistoryView
              ? 'Movies you\'ve finished — the signal your recommendations learn from.'
              : 'Track and manage the movies queued up for your next watch.' }}
          </p>
        </div>

        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <!-- View toggle: a two-button pill with amber accent for the active side. -->
          <div
            role="tablist"
            aria-label="Switch between watchlist and watch history"
            class="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm font-medium"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="!isHistoryView"
              :class="toggleButtonClass(!isHistoryView)"
              @click="setView('watchlist')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12a1 1 0 011 1v15l-7-3-7 3V5a1 1 0 011-1z" />
              </svg>
              Watchlist
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="isHistoryView"
              :class="toggleButtonClass(isHistoryView)"
              @click="setView('history')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>

          <RouterLink
            to="/search"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/25 bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Browse Movies
            <span aria-hidden="true">&rarr;</span>
          </RouterLink>
        </div>
      </header>

      <div v-if="activeLoading" class="space-y-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="n in 4"
            :key="`stat-${n}`"
            class="h-28 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]"
          />
        </div>
        <div class="space-y-5">
          <div
            v-for="n in 4"
            :key="`item-${n}`"
            class="h-44 animate-pulse rounded-[30px] border border-white/10 bg-white/[0.03]"
          />
        </div>
      </div>

      <div
        v-else-if="!activeItems.length"
        class="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_38%),rgba(255,255,255,0.03)] px-6 py-16 text-center"
      >
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
          <svg v-if="!isHistoryView" xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12a1 1 0 011 1v15l-7-3-7 3V5a1 1 0 011-1z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-white">
          {{ isHistoryView ? 'No watch history yet' : 'Your watchlist is empty' }}
        </h2>
        <p class="mt-2 text-zinc-400">
          {{ isHistoryView
            ? 'Mark saved movies as watched and they\'ll show up here.'
            : 'Start adding movies and this queue will turn into your next-night lineup.' }}
        </p>
        <RouterLink
          v-if="!isHistoryView"
          to="/search"
          class="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          Browse Movies
          <span aria-hidden="true">&rarr;</span>
        </RouterLink>
        <button
          v-else
          type="button"
          class="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
          @click="setView('watchlist')"
        >
          Go to Watchlist
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-zinc-400">{{ isHistoryView ? 'Movies Watched' : 'Saved Movies' }}</p>
                <p class="mt-2 text-4xl font-semibold text-white">{{ activeItems.length }}</p>
              </div>
            </div>
          </article>

          <article class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-zinc-400">{{ isHistoryView ? 'Watch Time' : 'Watch Time Left' }}</p>
                <p class="mt-2 text-4xl font-semibold text-white">{{ formatRuntimeStat(totalRuntimeMinutes) }}</p>
              </div>
            </div>
          </article>

          <!-- Stat #3 — "Added/Watched this month" (replaces the old Avg TMDB Rating card). -->
          <article class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 17l4-4 4 4m0-8H7" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-zinc-400">{{ isHistoryView ? 'Watched This Month' : 'Added This Month' }}</p>
                <p class="mt-2 text-4xl font-semibold text-white">+{{ activityThisMonth }}</p>
              </div>
            </div>
          </article>

          <article class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7a4 4 0 118 0c0 1.657-1.79 3.396-3 4.57a1.5 1.5 0 01-2.09 0C9.79 10.396 8 8.657 8 7z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 12v7" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-zinc-400">Top Genre</p>
                <p class="mt-2 text-3xl font-semibold text-white">{{ topGenreLabel }}</p>
              </div>
            </div>
          </article>
        </div>

        <p v-if="activeError" class="text-sm text-red-300">{{ activeError }}</p>

        <WatchlistPanel
          v-if="!isHistoryView"
          :items="watchlistItems"
          :marking-item-ids="watchlistStore.markingItemIds"
          @remove="removeWatchlistItem"
          @move-item="moveItem"
          @mark-watched="markWatched"
        />
        <HistoryPanel
          v-else
          :items="historyItems"
          :removing-item-ids="historyStore.removingItemIds"
          @remove="removeHistoryItem"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useWatchlistStore } from '../stores/watchlist.js'
import { useHistoryStore } from '../stores/history.js'
import WatchlistPanel from '../components/watchlist/WatchlistPanel.vue'
import HistoryPanel from '../components/history/HistoryPanel.vue'
import { formatRuntimeStat } from '../utils/formatters.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const watchlistStore = useWatchlistStore()
const historyStore = useHistoryStore()

const watchlistItems = computed(() => watchlistStore.sortedItems)
const historyItems = computed(() => historyStore.sortedItems)

// The URL query is the source of truth so the active tab survives reloads and
// can be deep-linked (e.g. the account dropdown sending users to history).
const isHistoryView = computed(() => route.query.view === 'history')

const activeItems = computed(() => (isHistoryView.value ? historyItems.value : watchlistItems.value))
const activeLoading = computed(() =>
  isHistoryView.value ? historyStore.loading : watchlistStore.loading,
)
const activeError = computed(() =>
  isHistoryView.value ? historyStore.error : watchlistStore.error,
)

const totalRuntimeMinutes = computed(() =>
  activeItems.value.reduce(
    (sum, item) => sum + (Number.isFinite(item.runtime) ? item.runtime : 0),
    0,
  ),
)

// Count entries whose timestamp falls in the current calendar month. For the
// watchlist that's `added_at`; for history it's `watched_at`.
const activityThisMonth = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const timestampKey = isHistoryView.value ? 'watched_at' : 'added_at'

  return activeItems.value.reduce((count, item) => {
    const parsed = Date.parse(item[timestampKey] || '')
    if (!parsed) return count
    const date = new Date(parsed)
    return date.getFullYear() === year && date.getMonth() === month ? count + 1 : count
  }, 0)
})

const topGenreLabel = computed(() => {
  const counts = new Map()

  for (const item of activeItems.value) {
    for (const genre of item.genres || []) {
      if (typeof genre !== 'string' || !genre.trim()) continue
      const normalized = genre.trim()
      counts.set(normalized, (counts.get(normalized) || 0) + 1)
    }
  }

  const topGenre = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]

  return topGenre?.[0] || 'No genres'
})

function toggleButtonClass(isActive) {
  const base = 'inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors'
  return isActive
    ? `${base} bg-amber-500 text-black shadow-sm`
    : `${base} text-zinc-300 hover:text-white`
}

function setView(mode) {
  const nextQuery = { ...route.query }
  if (mode === 'history') {
    nextQuery.view = 'history'
  } else {
    delete nextQuery.view
  }
  // `replace` keeps the back-button behavior sane — the tab toggle shouldn't
  // stack history entries on every click.
  router.replace({ path: route.path, query: nextQuery })
}

onMounted(() => {
  authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  // Kick off both stores so switching tabs feels instant instead of refetching.
  watchlistStore.initialize()
  historyStore.initialize()
})

// Lazily refresh whichever tab the user lands on, in case the other store was
// populated stale during a previous session.
watch(isHistoryView, (next) => {
  if (next) historyStore.initialize()
  else watchlistStore.initialize()
})

function removeWatchlistItem(itemId) {
  watchlistStore.removeItem(itemId)
}

function moveItem(from, to) {
  watchlistStore.moveItem(from, to)
}

function markWatched(item) {
  watchlistStore.markAsWatched(item)
}

function removeHistoryItem(itemId) {
  historyStore.removeItem(itemId)
}
</script>
