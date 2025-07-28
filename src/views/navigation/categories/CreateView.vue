<script setup>
import { useGlobalStore } from '@/stores/global'
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'

const toast = useToast()
const router = useRouter()
const globalStore = useGlobalStore()

// Поля
const form = ref({
  nameRU: '',
  nameTM: '',
  nameEN: '',
  url: '',
  image: null,
})

// Ошибки
const errors = ref({})

// Состояние
const submitting = ref(false)
const success = ref(false)

// Схема валидации
const schema = yup.object({
  nameRU: yup.string().required('Пожалуйста заполните поле'),
  url: yup.string().required('Пожалуйста заполните поле'),
  /* image: yup
    .mixed()
    .required('Пожалуйста загрузите изображение')
    .test('fileType', 'Только изображения разрешены', (value) => {
      return value && value.type && value.type.startsWith('image/')
    }), */
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
    const formData = new FormData()
    const name = {
      ru: form.value.nameRU,
      tm: form.value.nameTM,
      en: form.value.nameEN,
    }
    formData.append('name', JSON.stringify(name))
    formData.append('url', form.value.url)
    if (form.value.image) {
      formData.append('icon', form.value.image)
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.create_category,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    success.value = true
    toast.success('Категория успешно создана!')
    router.push('/navigation/categories')
    form.value = {
      nameRU: '',
      nameTM: '',
      nameEN: '',
      url: '',
      image: null,
    }
  } catch (e) {
    console.error('Created category failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
  }
}

// Превью изображения
const previewUrl = ref(null)

const handleFileUpload = (event) => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(file)
    form.value.image = event.target.files[0]
  } else {
    previewUrl.value = null
    form.value.image = null
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="overflow-x-auto bg-gray-900 p-4 rounded-lg">
    <!-- head -->
    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Создание категории
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
              Название категории RU <span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.nameRU"
              type="text"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.nameRU ? 'border-red-600' : '',
              ]"
              placeholder="Введите название на Русском"
            />
            <p v-if="errors.nameRU" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.nameRU }}
            </p>
          </div>

          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Название категории TM
            </label>
            <input
              v-model="form.nameTM"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите название на Туркменском"
            />
          </div>

          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Название категории EN
            </label>
            <input
              v-model="form.nameEN"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите название на Английском"
            />
          </div>
        </div>

        <!-- Строка inputs -->
        <div class="flex flex-wrap flex-row mt-5">
          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              URL категории <span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.url"
              type="text"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.url ? 'border-red-600' : '',
              ]"
              placeholder="Введите URL категории"
            />
            <p v-if="errors.url" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.url }}
            </p>
          </div>

          <!-- input for image upload -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Изображение категории
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileUpload"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2 bg-gray-800 cursor-pointer"
            />
            <p v-if="errors.image" class="text-red-600 text-sm">
              {{ errors.image }}
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
            {{ submitting ? 'Отправка...' : 'Создать категорию' }}
          </button>

          <button
            type="button"
            class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors ml-5 cursor-pointer"
            @click="$router.back()"
          >
            Отмена
          </button>
        </div>
      </form>

      <div v-if="previewUrl" class="mt-2 max-w-70 max-h-50 ml-10 overflow-hidden">
        <img
          :src="previewUrl"
          alt="Превью изображения"
          class="rounded border border-gray-700 w-full h-full object-cover object-center"
        />
      </div>
    </div>
  </div>
</template>
