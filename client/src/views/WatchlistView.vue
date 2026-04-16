<template>
  <div class="page-shell min-h-[calc(100vh-110px)]">
    <header class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="section-kicker">{{ isHistoryView ? 'History' : 'Watchlist' }}</p>
        <h1 class="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {{ isHistoryView ? 'Watch History' : 'My Watchlist' }}
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-[rgba(225,220,212,0.62)]">
          {{ isHistoryView
            ? 'Movies you have finished and the signal your recommendations learn from.'
            : 'Track and manage the movies queued up for your next watch.' }}
        </p>
      </div>

      <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Switch between watchlist and watch history"
          class="glass-panel-soft inline-flex rounded-full p-1"
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
          class="glass-button-primary inline-flex items-center justify-center px-5 py-3 text-sm"
        >
          Browse Movies
        </RouterLink>
      </div>
    </header>

    <div v-if="activeLoading" class="space-y-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="n in 4"
          :key="`stat-${n}`"
          class="skeleton-panel h-28"
        />
      </div>
      <div class="space-y-5">
        <div
          v-for="n in 4"
          :key="`item-${n}`"
          class="skeleton-panel h-44"
        />
      </div>
    </div>

    <div
      v-else-if="!activeItems.length"
      class="empty-state-panel px-6 py-16 text-center"
    >
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(255,214,152,0.22)] bg-[rgba(245,180,79,0.12)] text-[rgba(255,220,170,0.88)]">
        <svg v-if="!isHistoryView" xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12a1 1 0 011 1v15l-7-3-7 3V5a1 1 0 011-1z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="font-display text-xl font-semibold text-white">
        {{ isHistoryView ? 'No watch history yet' : 'Your watchlist is empty' }}
      </h2>
      <p class="mt-2 text-[rgba(225,220,212,0.62)]">
        {{ isHistoryView
          ? 'Mark saved movies as watched and they will show up here.'
          : 'Start adding movies and this queue will turn into your next-night lineup.' }}
      </p>
      <RouterLink
        v-if="!isHistoryView"
        to="/search"
        class="glass-button-primary mt-6 inline-flex px-5 py-3 text-sm"
      >
        Browse Movies
      </RouterLink>
      <button
        v-else
        type="button"
        class="glass-button-primary mt-6 inline-flex px-5 py-3 text-sm"
        @click="setView('watchlist')"
      >
        Go to Watchlist
      </button>
    </div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="stat-card">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(245,180,79,0.14)] text-[rgba(255,220,170,0.9)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-[rgba(225,220,212,0.58)]">{{ isHistoryView ? 'Movies Watched' : 'Saved Movies' }}</p>
              <p class="mt-2 font-display text-4xl font-semibold text-white">{{ activeItems.length }}</p>
            </div>
          </div>
        </article>

        <article class="stat-card">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(125,211,252,0.14)] text-[rgba(186,230,253,0.9)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-[rgba(225,220,212,0.58)]">{{ isHistoryView ? 'Watch Time' : 'Watch Time Left' }}</p>
              <p class="mt-2 font-display text-4xl font-semibold text-white">{{ formatRuntimeStat(totalRuntimeMinutes) }}</p>
            </div>
          </div>
        </article>

        <article class="stat-card">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(245,180,79,0.14)] text-[rgba(255,220,170,0.9)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 17l4-4 4 4m0-8H7" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-[rgba(225,220,212,0.58)]">{{ isHistoryView ? 'Watched This Month' : 'Added This Month' }}</p>
              <p class="mt-2 font-display text-4xl font-semibold text-white">+{{ activityThisMonth }}</p>
            </div>
          </div>
        </article>

        <article class="stat-card">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(110,231,183,0.14)] text-[rgba(209,250,229,0.9)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7a4 4 0 118 0c0 1.657-1.79 3.396-3 4.57a1.5 1.5 0 01-2.09 0C9.79 10.396 8 8.657 8 7z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 12v7" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-[rgba(225,220,212,0.58)]">Top Genre</p>
              <p class="mt-2 font-display text-3xl font-semibold text-white">{{ topGenreLabel }}</p>
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
  const base = 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors'
  return isActive
    ? `${base} glass-pill-active`
    : `${base} glass-pill text-[rgba(255,244,224,0.72)] hover:text-white`
}

function setView(mode) {
  const nextQuery = { ...route.query }
  if (mode === 'history') {
    nextQuery.view = 'history'
  } else {
    delete nextQuery.view
  }
  router.replace({ path: route.path, query: nextQuery })
}

onMounted(() => {
  authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  watchlistStore.initialize()
  historyStore.initialize()
})

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
