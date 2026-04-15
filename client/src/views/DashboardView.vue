<template>
  <div class="min-h-[calc(100vh-72px)] bg-[#050505]">
    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300/80">My Taste</p>
        <div class="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Taste Dashboard</h1>
            <p class="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
              <template v-if="authStore.user?.username">
                {{ authStore.user.username }},
              </template>
              your watch history now rolls up into a sharper read on your taste, pacing, and favorite moods.
            </p>
          </div>
        </div>
      </header>

      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="n in 4"
            :key="`stat-${n}`"
            class="h-32 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]"
          />
        </div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            v-for="n in 4"
            :key="`panel-${n}`"
            class="h-80 animate-pulse rounded-[30px] border border-white/10 bg-white/[0.03]"
          />
        </div>
      </div>

      <div
        v-else-if="error"
        class="rounded-[28px] border border-red-500/25 bg-red-500/5 p-6 text-sm text-red-200"
      >
        {{ error }}
      </div>

      <div
        v-else-if="isEmpty"
        class="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_38%),rgba(255,255,255,0.03)] px-6 py-16 text-center"
      >
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-white">Your dashboard is waiting</h2>
        <p class="mt-2 text-zinc-400">
          Mark a few movies as watched and CineMatch will start surfacing your taste profile.
        </p>
        <RouterLink
          to="/search"
          class="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          Browse Movies
          <span aria-hidden="true">&rarr;</span>
        </RouterLink>
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
                <p class="text-sm text-zinc-400">Movies Watched</p>
                <p class="mt-2 text-4xl font-semibold text-white">{{ stats.totalWatched }}</p>
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
                <p class="text-sm text-zinc-400">Watch Time</p>
                <p class="mt-2 text-4xl font-semibold text-white">{{ formatRuntimeStat(stats.totalRuntimeMinutes) }}</p>
              </div>
            </div>
          </article>

          <article class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.889a1 1 0 00-.364 1.118l1.519 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.078 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-zinc-400">Avg Rating</p>
                <p class="mt-2 text-4xl font-semibold text-white">{{ formatRating(stats.averageRating, '--') }}</p>
              </div>
            </div>
          </article>

          <article class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 17l4-4 4 4m0-8H7" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-zinc-400">This Month</p>
                <p class="mt-2 text-4xl font-semibold text-white">+{{ stats.watchedThisMonth }}</p>
              </div>
            </div>
          </article>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article class="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="mb-5 flex items-baseline justify-between gap-3">
              <div>
                <h2 class="text-2xl font-semibold text-white">Favorite Genres</h2>
                <p class="mt-1 text-sm text-zinc-400">The genres that keep showing up in your watch history.</p>
              </div>
              <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                {{ stats.genreBreakdown.length }} tracked
              </span>
            </div>
            <GenrePieChart :data="stats.genreBreakdown" />
          </article>

          <article class="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div class="mb-5">
              <h2 class="text-2xl font-semibold text-white">Mood Preferences</h2>
              <p class="mt-1 text-sm text-zinc-400">A genre-driven read on the moods your recent watches lean toward.</p>
            </div>
            <MoodRadarChart :data="stats.moodPreferences" />
          </article>

          <article class="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:col-span-2">
            <div class="mb-5 flex items-baseline justify-between gap-3">
              <div>
                <h2 class="text-2xl font-semibold text-white">Watch Cadence</h2>
                <p class="mt-1 text-sm text-zinc-400">How often you have been marking movies as watched over time.</p>
              </div>
              <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                {{ stats.timeline.length }} months
              </span>
            </div>
            <TimelineChart :data="stats.timeline" />
          </article>

          <article class="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:col-span-2">
            <div class="mb-5 flex items-baseline justify-between gap-3">
              <div>
                <h2 class="text-2xl font-semibold text-white">Movies by Decade</h2>
                <p class="mt-1 text-sm text-zinc-400">Which release eras dominate your watched history.</p>
              </div>
              <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                {{ stats.moviesByDecade.length }} decades
              </span>
            </div>
            <DecadeBarChart :data="stats.moviesByDecade" />
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'
import GenrePieChart from '../components/dashboard/GenrePieChart.vue'
import TimelineChart from '../components/dashboard/TimelineChart.vue'
import DecadeBarChart from '../components/dashboard/DecadeBarChart.vue'
import MoodRadarChart from '../components/dashboard/MoodRadarChart.vue'
import { formatRating, formatRuntimeStat } from '../utils/formatters.js'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref(null)
const loading = ref(true)
const error = ref('')

const isEmpty = computed(() => Boolean(stats.value) && stats.value.totalWatched === 0)

onMounted(async () => {
  authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  loading.value = true
  error.value = ''
  try {
    stats.value = await api.getStats()
  } catch (err) {
    if (err?.status === 401) {
      router.push('/login')
      return
    }
    error.value = err?.message || 'Failed to load dashboard stats.'
  } finally {
    loading.value = false
  }
})
</script>
