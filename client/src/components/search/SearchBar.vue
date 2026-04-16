<template>
  <div class="relative">
    <!-- Search icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgba(255,210,150,0.48)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>

    <input
      ref="inputEl"
      type="text"
      :value="modelValue"
      @input="onInput"
      :placeholder="placeholder"
      class="glass-input rounded-[1.35rem] py-3.5 pl-12 pr-11 text-[0.98rem] shadow-soft"
    />

    <!-- Clear button -->
    <button
      v-if="modelValue"
      @click="clear"
      class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[rgba(255,244,224,0.54)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search movies...' },
})

const emit = defineEmits(['update:modelValue', 'search'])
const inputEl = ref(null)

// Debounce typing so parent views do not hit TMDB on every keystroke.
let debounceTimer = null

function onInput(e) {
  const value = e.target.value
  emit('update:modelValue', value)

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', value)
  }, 300)
}

function clear() {
  clearTimeout(debounceTimer)
  emit('update:modelValue', '')
  emit('search', '')
  inputEl.value?.focus()
}
</script>
