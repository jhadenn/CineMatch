<template>
  <form class="space-y-4" @submit.prevent="submitForm">
    <div>
      <label for="email" class="mb-2 block text-sm text-[rgba(236,229,218,0.82)]">Email</label>
      <input
        id="email"
        v-model.trim="email"
        type="email"
        autocomplete="email"
        class="glass-input rounded-2xl px-4 py-3"
        placeholder="you@example.com"
      />
    </div>

    <div>
      <label for="password" class="mb-2 block text-sm text-[rgba(236,229,218,0.82)]">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        class="glass-input rounded-2xl px-4 py-3"
        placeholder="Enter your password"
      />
    </div>

    <p v-if="localError || errorMessage" class="text-sm text-red-300">{{ localError || errorMessage }}</p>

    <button
      type="submit"
      class="glass-button-primary w-full px-4 py-3.5"
      :disabled="submitting"
    >
      {{ submitting ? 'Signing in...' : 'Log in' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  submitting: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['submit'])

const email = ref('')
const password = ref('')
const localError = ref('')

function submitForm() {
  localError.value = ''
  if (!email.value || !password.value) {
    localError.value = 'Please enter both email and password.'
    return
  }

  emit('submit', {
    email: email.value,
    password: password.value,
  })
}
</script>
