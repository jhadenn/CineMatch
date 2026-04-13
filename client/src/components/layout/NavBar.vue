<template>
  <nav class="bg-gray-900 border-b border-gray-800 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">

      <!-- Brand -->
      <div class="flex items-center gap-8">
        <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          <!-- Film strip SVG icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
          CineMatch
        </RouterLink>

        <!-- Nav links -->
        <div class="hidden sm:flex items-center gap-6 text-sm font-medium">
          <RouterLink
            to="/"
            class="text-gray-300 hover:text-white transition-colors"
            active-class="text-white"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/search"
            class="text-gray-300 hover:text-white transition-colors"
            active-class="text-white"
          >
            Search
          </RouterLink>
          <!-- Placeholder — routing not wired yet -->
          <a href="#" class="text-gray-500 cursor-default select-none" title="Coming soon">Watchlist</a>
          <a href="#" class="text-gray-500 cursor-default select-none" title="Coming soon">Dashboard</a>
        </div>
      </div>

      <!-- Auth buttons -->
      <div class="flex items-center gap-3 text-sm font-medium">
        <RouterLink
          to="/login"
          class="px-4 py-1.5 rounded text-gray-300 hover:text-white transition-colors"
        >
          Login
        </RouterLink>
        <RouterLink
          to="/register"
          class="px-4 py-1.5 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors text-white"
        >
          Register
        </RouterLink>
      </div>

    </div>
  </nav>
</template>
