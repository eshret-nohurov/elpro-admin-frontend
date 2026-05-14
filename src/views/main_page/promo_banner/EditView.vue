<script setup>
/*
 * Promo Banner Edit
 * Редактирует промо-баннер и сохраняет новое изображение, если оно выбрано.
 */
import AppHelpModal from '@/components/AppHelpModal.vue'

import { useGlobalStore } from '@/stores/global'
import { resolveMediaUrl } from '@/utils/media'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'

const route = useRoute()
const router = useRouter()
const globalStore = useGlobalStore()
const toast = useToast()

const loading = ref(false)
const id = route.params.id


const errors = ref({})


const submitting = ref(false)
const success = ref(false)


const form = ref({
  name: '',
  url: '',
  image: null,
})
const isModalOpen = ref(false)


const schema = yup.object({
  name: yup.string().required('Пожалуйста заполните поле'),
})


const fetchSlide = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.promo_banner_slide(id),
    })

    form.value = {
      name: response.data.name,
      url: response.data.url,
      image: response.data.image,
    }

    console.log(form.value)
  } catch (e) {
    console.error('fetchSlide failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}


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
    formData.append('name', form.value.name)
    formData.append('url', form.value.url)
    if (form.value.image instanceof File) {
      formData.append('image', form.value.image)
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.update_promo_banner_slide(id),
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    success.value = true
    toast.success('Слайд успешно изменен!')
    router.back()
    form.value = {
      name: '',
      url: '',
      image: null,
    }
  } catch (e) {
    console.error('Edit slide failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
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

onMounted(fetchSlide)
</script>

<template>
  <AppHelpModal v-model:isOpen="isModalOpen" @close="isModalOpen = false" />

  <div class="overflow-x-auto bg-gray-900 p-4 rounded-lg">

    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Редактирование слайда промо баннера
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
              Название слайда<span class="text-red-600">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              :class="[
                'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                errors.name ? 'border-red-600' : '',
              ]"
              placeholder="Введите название"
            />
            <p v-if="errors.name" class="text-red-600 text-sm mt-1 px-1">
              {{ errors.name }}
            </p>
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2"> URL </label>
            <input
              v-model="form.url"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите URL"
            />
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="flex text-sm font-medium text-gray-200 mb-2">
              Изображение <span class="text-red-600 ml-1">*</span>
              <div
                class="ml-2 w-4 h-4 bg-indigo-600 rounded-4xl text-center text-xs cursor-pointer"
                @click="isModalOpen = true"
              >
                ?
              </div>
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
            {{ submitting ? 'Отправка...' : 'Изменить слайд' }}
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

      <div v-if="!previewUrl && form.image" class="mt-4 w-full max-w-xs overflow-hidden sm:ml-10">
        <img
          :src="resolveMediaUrl(form.image)"
          alt="Превью изображения"
          class="rounded border border-gray-700 w-full h-full object-cover object-center"
        />
      </div>
    </div>
  </div>
</template>
