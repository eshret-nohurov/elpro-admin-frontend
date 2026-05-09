<script setup>
/*
 * Subcategory Create
 * Создает подкатегорию с переводами, родителем, URL и изображением.
 */
import { useGlobalStore } from '@/stores/global'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'

const toast = useToast()
const router = useRouter()
const globalStore = useGlobalStore()


const form = ref({})
const categories = ref([])


const errors = ref({})


const loading = ref(false)
const submitting = ref(false)
const success = ref(false)


const schema = yup.object({
  nameRU: yup.string().required('Пожалуйста заполните поле'),
  url: yup.string().required('Пожалуйста заполните поле'),

  category: yup.string().required('Пожалуйста выберите категорию'),
})


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
    formData.append('category', form.value.category)
    if (form.value.image) {
      formData.append('icon', form.value.image)
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.create_subcategory,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    success.value = true
    toast.success('Подкатегория успешно создана!')
    router.back()
    form.value = {
      nameRU: '',
      nameTM: '',
      nameEN: '',
      url: '',
      category: '1',
      image: null,
    }
  } catch (e) {
    console.error('Created subcategory failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
  }
}


const fetchCategoryForSubcategory = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.categoriesForSubcategory,
    })

    categories.value = response.data

    console.log(categories.value)
  } catch (e) {
    console.error('fetchCategoryForSubcategory failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}


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

onMounted(fetchCategoryForSubcategory)
</script>

<template>
  <div class="overflow-x-auto bg-gray-900 p-4 rounded-lg">

    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Создание подкатегории
      </span>

      <span
        class="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"
      ></span>
    </div>


    <div class="flex">
      <form class="mt-10" @submit.prevent="submitForm">

        <div class="flex flex-wrap flex-row">

          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Название подкатегории RU <span class="text-red-600">*</span>
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


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Название подкатегории TM
            </label>
            <input
              v-model="form.nameTM"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите название на Туркменском"
            />
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Название подкатегории EN
            </label>
            <input
              v-model="form.nameEN"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите название на Английском"
            />
          </div>
        </div>


        <div class="flex flex-wrap flex-row mt-5">

          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              URL подкатегории <span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.url"
              type="text"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.url ? 'border-red-600' : '',
              ]"
              placeholder="Введите URL подкатегории"
            />
            <p v-if="errors.url" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.url }}
            </p>
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Категория <span class="text-red-600">*</span>
            </label>
            <select
              v-model="form.category"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.category ? 'border-red-600' : '',
              ]"
            >
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
            <p v-if="errors.category" class="text-red-600 text-sm">
              {{ errors.category }}
            </p>
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Изображение подкатегории
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


        <div class="flex flex-wrap flex-row mt-5">
          <button
            type="submit"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors cursor-pointer"
            :disabled="submitting"
          >
            {{ submitting ? 'Отправка...' : 'Создать подкатегорию' }}
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

      <div v-if="previewUrl" class="mt-4 w-full max-w-xs overflow-hidden sm:ml-10">
        <img
          :src="previewUrl"
          alt="Превью изображения"
          class="rounded border border-gray-700 w-full h-full object-cover object-center"
        />
      </div>
    </div>
  </div>
</template>
