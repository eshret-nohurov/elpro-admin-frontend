<script setup>
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const globalStore = useGlobalStore()
const toast = useToast()
const router = useRouter()

const username = ref('')
const password = ref('')
const captchaQuestion = ref('')
const captchaToken = ref('')
const captchaAnswer = ref('')
const isCaptchaLoading = ref(false)
const isSubmitting = ref(false)

const canSubmit = computed(
  () =>
    username.value.trim() &&
    password.value &&
    captchaAnswer.value !== '' &&
    captchaToken.value &&
    !isSubmitting.value,
)

const fetchCaptcha = async () => {
  try {
    isCaptchaLoading.value = true
    captchaAnswer.value = ''

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.captcha,
      requreAuth: false,
    })

    captchaQuestion.value = response.question
    captchaToken.value = response.token
  } catch (error) {
    captchaQuestion.value = ''
    captchaToken.value = ''
    toast.error('Не удалось загрузить капчу')
  } finally {
    isCaptchaLoading.value = false
  }
}

const handleLogin = async () => {
  if (!canSubmit.value) {
    toast.error('Заполните логин, пароль и капчу')
    return
  }

  try {
    isSubmitting.value = true

    const response = await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.login,
      data: {
        username: username.value,
        password: password.value,
        captchaToken: captchaToken.value,
        captchaAnswer: captchaAnswer.value,
      },
      requreAuth: false,
    })

    authStore.login(response.token, response.user)
    toast.success('Успешный вход в систему!')
    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
    await fetchCaptcha()
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchCaptcha)
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
          <label for="captcha" class="block text-sm/6 font-medium text-white">
            Проверка
          </label>

          <div
            class="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-white/45">Captcha</p>
                <p class="mt-1 text-lg font-semibold text-white">
                  {{ isCaptchaLoading ? 'Загружаем...' : `${captchaQuestion} = ?` }}
                </p>
              </div>

              <button
                type="button"
                class="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10"
                :disabled="isCaptchaLoading"
                @click="fetchCaptcha"
              >
                Обновить
              </button>
            </div>

            <input
              id="captcha"
              v-model="captchaAnswer"
              type="number"
              inputmode="numeric"
              required
              placeholder="Ответ"
              class="mt-3 block w-full rounded-md px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="mt-10 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-900 disabled:text-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            :disabled="!canSubmit"
            @click.prevent="handleLogin"
          >
            {{ isSubmitting ? 'Проверяем...' : 'Войти' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
