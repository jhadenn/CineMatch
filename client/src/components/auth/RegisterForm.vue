<template>
  <form class="space-y-4" @submit.prevent="submitForm">
    <div>
      <label for="username" class="mb-1.5 block text-sm text-gray-300">Username</label>
      <input
        id="username"
        v-model.trim="username"
        type="text"
        autocomplete="username"
        class="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-violet-400/70 focus:outline-none"
        placeholder="MovieFan123"
      />
    </div>

    <div>
      <label for="email" class="mb-1.5 block text-sm text-gray-300">Email</label>
      <input
        id="email"
        v-model.trim="email"
        type="email"
        autocomplete="email"
        class="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-violet-400/70 focus:outline-none"
        placeholder="you@example.com"
      />
    </div>

    <div>
      <label for="password" class="mb-1.5 block text-sm text-gray-300">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        class="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-violet-400/70 focus:outline-none"
        placeholder="At least 6 characters"
      />
    </div>

    <div>
      <label for="confirmPassword" class="mb-1.5 block text-sm text-gray-300">Confirm password</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        autocomplete="new-password"
        class="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-violet-400/70 focus:outline-none"
        placeholder="Re-enter password"
      />
    </div>

    <p v-if="localError || errorMessage" class="text-sm text-red-300">{{ localError || errorMessage }}</p>

    <button
      type="submit"
      class="w-full rounded-xl bg-[#7c3aed] py-2.5 font-medium text-white hover:bg-[#6d28d9] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
