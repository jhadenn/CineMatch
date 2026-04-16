<template>
  <div class="page-shell-narrow min-h-[calc(100vh-120px)]">
    <div class="glass-panel-strong mx-auto max-w-md overflow-hidden p-6 sm:p-8">
      <div class="floating-accent" />
      <div class="relative z-10">
        <p class="section-kicker">Welcome back</p>
        <h1 class="section-title text-[clamp(2.25rem,8vw,3.3rem)]">Log in to CineMatch</h1>
        <p class="section-subtitle max-w-none">Access your watchlist, recommendations, and taste dashboard from the same cinematic home base.</p>

        <div class="mt-8">
          <LoginForm
            :submitting="submitting"
            :error-message="errorMessage"
            @submit="handleSubmit"
          />
        </div>

        <p class="mt-6 text-sm text-[rgba(225,220,212,0.62)]">
          New here?
          <RouterLink to="/register" class="ml-1 text-[#ffd89d] transition-colors hover:text-[#fff1cf]">Create an account</RouterLink>
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
