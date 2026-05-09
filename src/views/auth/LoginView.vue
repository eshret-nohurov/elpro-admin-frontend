<script setup>
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const globalStore = useGlobalStore()
const toast = useToast()
const router = useRouter()

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.login,
      data: { username: username.value, password: password.value },
      requreAuth: false,
    })
    authStore.login(response.token, response.user)
    toast.success('Успешный вход в систему!')
    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img class="mx-auto h-30 w-auto" src="@/assets/img/logo/logo-white.png" />
      <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
        Вход в систему
      </h2>
    </div>

    <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" action="#" method="POST">
        <div>
          <label for="username" class="block text-sm/6 font-medium text-white">User Name</label>
          <div class="mt-2">
            <input
              type="text"
              name="username"
              v-model="username"
              id="username"
              required
              class="block w-full rounded-md px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm/6 font-medium text-white">Password</label>
          </div>
          <div class="mt-2">
            <input
              type="password"
              name="password"
              v-model="password"
              id="password"
              autocomplete="current-password"
              required
              class="block w-full rounded-md px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-10"
            @click.prevent="handleLogin"
          >
            Войти
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
