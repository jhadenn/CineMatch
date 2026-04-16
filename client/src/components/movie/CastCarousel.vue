<template>
  <div class="relative">
    <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      <div
        v-for="member in topCast"
        :key="member.id"
        class="glass-panel-soft flex-shrink-0 w-28 p-2"
      >
        <!-- Headshot -->
        <div class="media-frame mb-2 aspect-[2/3] overflow-hidden rounded-xl">
          <img
            v-if="member.profile_path"
            :src="`https://image.tmdb.org/t/p/w185${member.profile_path}`"
            :alt="member.name"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-[rgba(188,176,160,0.42)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <!-- Name & character -->
        <p class="truncate text-sm font-medium text-white">{{ member.name }}</p>
        <p class="truncate text-xs text-[rgba(225,220,212,0.56)]">{{ member.character }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cast: { type: Array, default: () => [] },
})

// Keep the cast strip readable by showing the most prominent names first.
const topCast = computed(() => props.cast.slice(0, 15))
</script>
