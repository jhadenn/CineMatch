<template>
  <div class="min-h-[calc(100vh-72px)] bg-gray-950 px-4 py-10 sm:py-14">
    <div class="mx-auto w-full max-w-md">
      <div class="rounded-3xl border border-violet-400/20 bg-white/[0.03] p-6 sm:p-7 shadow-xl shadow-black/30 backdrop-blur-sm">
        <p class="text-xs font-semibold tracking-wider text-violet-300 uppercase">Welcome back</p>
        <h1 class="mt-2 text-3xl font-bold text-white">Log in to CineMatch</h1>
        <p class="mt-2 text-sm text-gray-400">Access your watchlist and personalized picks.</p>

        <div class="mt-6">
          <LoginForm
            :submitting="submitting"
            :error-message="errorMessage"
            @submit="handleSubmit"
          />
        </div>

        <p class="mt-6 text-sm text-gray-400">
          New here?
          <RouterLink to="/register" class="text-violet-300 hover:text-violet-200 transition-colors">Create an account</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import LoginForm from '../components/auth/LoginForm.vue'

const router = useRouter()
const authStore = useAuthStore()
const submitting = ref(false)
const errorMessage = ref('')

authStore.initialize()

async function handleSubmit(payload) {
  submitting.value = true
  errorMessage.value = ''
  const result = await authStore.login(payload)
  submitting.value = false

  if (!result.ok) {
    errorMessage.value = result.error
    return
  }

  router.push('/')
}
</script>
