<script setup>
import { useGlobalStore } from '@/stores/global'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'

const router = useRouter()
const globalStore = useGlobalStore()
const toast = useToast()

const loading = ref(false)

// Ошибки
const errors = ref({})

// Состояние
const submitting = ref(false)
const success = ref(false)

// Поля
const form = ref({})

// Схема валидации
const schema = yup.object({
  usdToTmtRate: yup.string().required('Пожалуйста заполните поле'),
})

// GET DATA
const fetchSettings = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.settings,
    })

    if (response.data.length > 0) {
      form.value.usdToTmtRate = response.data[0].usdToTmtRate
      form.value.id = response.data[0]._id
    }
  } catch (e) {
    console.error('fetchSettings failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

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
      usdToTmtRate: form.value.usdToTmtRate,
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: !form.value.id
        ? globalStore.api.endpoints.create_settings
        : globalStore.api.endpoints.update_settings(form.value.id),
      data: data,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    success.value = true
    toast.success('Настроки!')
    fetchSettings()
  } catch (e) {
    console.error('Edit user failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="bg-gray-900 p-4 rounded-lg">
    <!-- head -->
    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl"> Настройки </span>

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
          <div class="w-50 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              USD TO TMT RATE <span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.usdToTmtRate"
              type="number"
              step="0.1"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.usdToTmtRate ? 'border-red-600' : '',
              ]"
            />
            <p v-if="errors.usdToTmtRate" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.usdToTmtRate }}
            </p>
          </div>
        </div>

        <!-- Строка BUTTONS -->
        <div class="flex flex-wrap flex-row mt-5">
          <button
            type="submit"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors cursor-pointer"
            :disabled="submitting"
          >
            {{ submitting ? 'Отправка...' : 'Обновления Настроек' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
