<script setup>
import { useGlobalStore } from '@/stores/global'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'

const toast = useToast()
const router = useRouter()
const globalStore = useGlobalStore()

// Поля
const form = ref({})

// Ошибки
const errors = ref({})

// Состояние
const submitting = ref(false)
const success = ref(false)

// Схема валидации
const schema = yup.object({
  username: yup.string().required('Пожалуйста заполните поле'),
  password: yup
    .string()
    .required('Пожалуйста заполните поле')
    .min(8, 'Пароль должен содержать минимум 8 символов'),
})

// Отправка формы
const submitForm = async () => {
  errors.value = {}

  try {
    await schema.validate(form.value, { abortEarly: false })
  } catch (err) {
    if (err.inner) {
      err.inner.forEach((e) => {
        errors.value[e.path] = e.message
      })
    }
    return
  }

  submitting.value = true
  try {
    const data = {
      username: form.value.username,
      password: form.value.password,
      role: form.value.role,
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.create_user,
      data: data,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    success.value = true
    toast.success('Пользователь успешно создан!')
    router.back()
    form.value = {}
  } catch (e) {
    console.error('Created user failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="bg-gray-900 p-4 rounded-lg">
    <!-- head -->
    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Создание пользователя
      </span>

      <span
        class="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"
      ></span>
    </div>

    <!-- body -->
    <div class="flex">
      <form class="mt-10" @submit.prevent="submitForm">
        <!-- Строка inputs -->
        <div class="flex flex-wrap flex-row">
          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Имя пользователя <span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.username"
              type="text"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.username ? 'border-red-600' : '',
              ]"
              placeholder="Введите Имя Пользователя"
            />
            <p v-if="errors.username" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.username }}
            </p>
          </div>

          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Пароль <span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.password"
              type="text"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.password ? 'border-red-600' : '',
              ]"
              placeholder="Введите Пароль"
            />
            <p v-if="errors.password" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.password }}
            </p>
          </div>

          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <fieldset class="space-y-3">
              <legend class="sr-only">User_role</legend>

              <div>
                <label
                  for="admin"
                  class="flex items-center justify-between gap-4 rounded border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 has-checked:border-blue-600 has-checked:ring-1 has-checked:ring-blue-600 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div>
                    <p class="text-gray-900 dark:text-white">Админ</p>
                  </div>

                  <input
                    type="radio"
                    v-model="form.role"
                    value="admin"
                    id="admin"
                    class="size-5 border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:ring-offset-gray-900 dark:checked:bg-blue-600"
                    checked
                  />
                </label>
              </div>

              <div>
                <label
                  for="seller"
                  class="flex items-center justify-between gap-4 rounded border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 has-checked:border-blue-600 has-checked:ring-1 has-checked:ring-blue-600 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div>
                    <p class="text-gray-900 dark:text-white">Продавец</p>
                  </div>

                  <input
                    type="radio"
                    v-model="form.role"
                    value="seller"
                    id="seller"
                    class="size-5 border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:ring-offset-gray-900 dark:checked:bg-blue-600"
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        <!-- Строка BUTTONS -->
        <div class="flex flex-wrap flex-row mt-5">
          <button
            type="submit"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors cursor-pointer"
            :disabled="submitting"
          >
            {{ submitting ? 'Отправка...' : 'Создать пользователя' }}
          </button>

          <button
            type="button"
            class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors mt-3 sm:mt-0 sm:ml-5 cursor-pointer"
            @click="$router.back()"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
