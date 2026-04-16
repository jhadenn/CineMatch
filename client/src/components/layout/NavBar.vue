<!--
  Shared top navigation.
  Combines route-aware nav pills, a desktop search shortcut, and account menu
  state while keeping auth initialization close to the persistent shell.
-->
<template>
  <header class="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
    <nav class="glass-nav-shell flex w-full items-center gap-3 px-3 py-3 sm:px-4 lg:px-5">
      <RouterLink to="/" aria-label="CineMatch home" class="flex items-center gap-3 rounded-full px-2 py-1.5 text-white transition-colors hover:text-[#fff5e3]">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(255,255,255,0.12)] bg-[#120d12] shadow-[0_10px_24px_rgba(245,180,79,0.16)]">
          <img :src="cinematchLogo" alt="" class="h-full w-full object-contain" />
        </span>
        <span class="hidden sm:block">
          <span class="block font-display text-lg font-semibold tracking-[-0.03em] text-white">CineMatch</span>
          
        </span>
      </RouterLink>

      <div class="hidden md:flex items-center gap-2 lg:gap-2.5 text-xs lg:text-sm font-medium mx-auto">
        <RouterLink to="/" :class="navLinkClass(isDiscoverActive)">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h3a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm9 0a2 2 0 012-2h3a2 2 0 012 2v5a2 2 0 01-2 2h-3a2 2 0 01-2-2V6zm0 9a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z" />
          </svg>
          <span>Discover</span>
        </RouterLink>
        <RouterLink to="/watchlist" :class="navLinkClass(route.path.startsWith('/watchlist'))">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12a1 1 0 011 1v15l-7-3-7 3V5a1 1 0 011-1z" />
          </svg>
          <span>Watchlist</span>
        </RouterLink>
        <RouterLink v-if="authStore.isAuthenticated" to="/dashboard" :class="navLinkClass(route.path.startsWith('/dashboard'))">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6" />
          </svg>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink v-if="authStore.isAuthenticated" to="/recommendations" :class="navLinkClass(route.path.startsWith('/recommendations'))">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Recommendations</span>
        </RouterLink>
      </div>

      <div class="relative ml-auto flex items-center gap-2 sm:gap-3">
        <form
          class="glass-input hidden w-[clamp(13rem,24vw,23rem)] items-center rounded-full px-3.5 py-2.5 text-[rgba(255,244,224,0.75)] md:flex"
          @submit.prevent="submitSearch"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4 text-[rgba(255,210,150,0.52)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search movies..."
            class="w-full bg-transparent text-sm text-[rgba(255,244,224,0.9)] placeholder:text-[rgba(191,178,159,0.58)] focus:outline-none"
          />
        </form>

        <button
          ref="accountButtonRef"
          type="button"
          :class="accountButtonClass"
          aria-label="Account menu"
          aria-haspopup="menu"
          :aria-expanded="isAccountMenuOpen"
          @click="toggleAccountMenu"
        >
          <span v-if="authStore.isAuthenticated && accountInitial" class="text-sm font-semibold">
            {{ accountInitial }}
          </span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A10.963 10.963 0 0112 15c2.5 0 4.847.815 6.879 2.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <div
          v-if="isAccountMenuOpen"
          ref="accountMenuRef"
          class="glass-panel-strong absolute right-0 top-[calc(100%+0.85rem)] w-52 p-1.5"
          role="menu"
          aria-label="Account options"
        >
          <template v-if="authStore.isAuthenticated">
            <div class="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-3">
              <p class="text-[0.7rem] uppercase tracking-[0.22em] text-[rgba(193,180,164,0.55)]">Signed in as</p>
              <p class="mt-1 truncate text-sm font-medium text-[#fff3dc]">{{ authStore.user?.username || authStore.user?.email }}</p>
            </div>
            <button
              type="button"
              class="glass-button-secondary mt-2 w-full justify-start px-3 py-3 text-sm"
              role="menuitem"
              @click="logout"
            >
              Log out
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="glass-button-secondary w-full justify-start px-3 py-3 text-sm"
              role="menuitem"
              @click="closeAccountMenu"
            >
              Log in
            </RouterLink>
            <RouterLink
              to="/register"
              class="glass-button-primary mt-2 w-full justify-center px-3 py-3 text-sm"
              role="menuitem"
              @click="closeAccountMenu"
            >
              Sign up
            </RouterLink>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import cinematchLogo from '../../assets/cinematch-logo.png'
import { useAuthStore } from '../../stores/auth.js'
import { useHistoryStore } from '../../stores/history.js'
import { useWatchlistStore } from '../../stores/watchlist.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const historyStore = useHistoryStore()
const watchlistStore = useWatchlistStore()
const searchQuery = ref('')
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const accountButtonRef = ref(null)
const isDiscoverActive = computed(() => route.path === '/' || route.path.startsWith('/search') || route.path.startsWith('/movie/'))
const accountInitial = computed(() => {
  const label = authStore.user?.username || authStore.user?.email || ''
  return label ? label.charAt(0).toUpperCase() : ''
})
const accountButtonClass = computed(() => {
  const base = 'icon-button h-10 w-10 sm:h-11 sm:w-11'
  return authStore.isAuthenticated
    ? `${base} icon-button-accent text-[#fff5df]`
    : `${base} glass-button-secondary text-[rgba(255,244,224,0.82)]`
})

function navLinkClass(isActive) {
  if (isActive) {
    return 'glass-pill glass-pill-active px-3.5 py-2 lg:px-4'
  }
  return 'glass-pill px-3.5 py-2 text-[rgba(255,244,224,0.74)] hover:text-white lg:px-4'
}

function submitSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
}

function toggleAccountMenu() {
  isAccountMenuOpen.value = !isAccountMenuOpen.value
}

function closeAccountMenu() {
  isAccountMenuOpen.value = false
}

function logout() {
  authStore.logout()
  historyStore.clearState()
  watchlistStore.clearState()
  closeAccountMenu()
  router.push('/login')
}

function handleDocumentClick(event) {
  if (!isAccountMenuOpen.value) return
  const target = event.target
  const menu = accountMenuRef.value
  const button = accountButtonRef.value
  if (!menu) return
  if (target instanceof Node && !menu.contains(target) && (!button || !button.contains(target))) {
    closeAccountMenu()
  }
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    closeAccountMenu()
  }
}

onMounted(() => {
  authStore.initialize()
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})
</script>
