<!--
  Stateless account creation form.
  Keeps password confirmation and basic required-field validation local before
  emitting a backend-ready registration payload.
-->
<template>
  <form class="space-y-4" @submit.prevent="submitForm">
    <div>
      <label for="username" class="mb-2 block text-sm text-[rgba(236,229,218,0.82)]">Username</label>
      <input
        id="username"
        v-model.trim="username"
        type="text"
        autocomplete="username"
        class="glass-input rounded-2xl px-4 py-3"
        placeholder="MovieFan123"
      />
    </div>

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
        autocomplete="new-password"
        class="glass-input rounded-2xl px-4 py-3"
        placeholder="At least 6 characters"
      />
    </div>

    <div>
      <label for="confirmPassword" class="mb-2 block text-sm text-[rgba(236,229,218,0.82)]">Confirm password</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        autocomplete="new-password"
        class="glass-input rounded-2xl px-4 py-3"
        placeholder="Re-enter password"
      />
    </div>

    <p v-if="localError || errorMessage" class="text-sm text-red-300">{{ localError || errorMessage }}</p>

    <button
      type="submit"
      class="glass-button-primary w-full px-4 py-3.5"
      :disabled="submitting"
    >
      {{ submitting ? 'Creating account...' : 'Sign up' }}
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

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref('')

function submitForm() {
  localError.value = ''
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    localError.value = 'Please fill in all fields.'
    return
  }
  if (password.value.length < 6) {
    localError.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match.'
    return
  }

  emit('submit', {
    username: username.value,
    email: email.value,
    password: password.value,
  })
}
</script>
