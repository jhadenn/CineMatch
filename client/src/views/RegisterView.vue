<!--
  Registration page wrapper.
  New users are sent back to login after account creation so they exercise the
  same persisted-auth path as returning users.
-->
<template>
  <div class="page-shell-narrow min-h-[calc(100vh-120px)]">
    <div class="glass-panel-strong mx-auto max-w-md overflow-hidden p-6 sm:p-8">
      <div class="floating-accent" />
      <div class="relative z-10">
        <p class="section-kicker">Join CineMatch</p>
        <h1 class="section-title text-[clamp(2.25rem,8vw,3.3rem)]">Create your account</h1>
        <p class="section-subtitle max-w-none">Start building your watchlist in seconds and unlock a cleaner, more personalized movie discovery flow.</p>

        <div class="mt-8">
          <RegisterForm
            :submitting="submitting"
            :error-message="errorMessage"
            @submit="handleSubmit"
          />
        </div>

        <p class="mt-6 text-sm text-[rgba(225,220,212,0.62)]">
          Already have an account?
          <RouterLink to="/login" class="ml-1 text-[#ffd89d] transition-colors hover:text-[#fff1cf]">Log in</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import RegisterForm from '../components/auth/RegisterForm.vue'

const router = useRouter()
const authStore = useAuthStore()
const submitting = ref(false)
const errorMessage = ref('')

authStore.initialize()

async function handleSubmit(payload) {
  submitting.value = true
  errorMessage.value = ''
  const result = await authStore.register(payload)
  submitting.value = false

  if (!result.ok) {
    errorMessage.value = result.error
    return
  }

  authStore.logout()
  router.push('/login')
}
</script>
