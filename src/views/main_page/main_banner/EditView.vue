<script setup>
/*
 * Main Banner Edit
 * Редактирует слайд главного баннера и обновляет изображение при необходимости.
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
  mobileImage: null,
})
const isModalOpen = ref(false)
const helpModalType = ref('image')

const openHelpModal = type => {
  helpModalType.value = type
  isModalOpen.value = true
}


const schema = yup.object({
  name: yup.string().required('Пожалуйста заполните поле'),
})

const fetchSlide = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.main_banner_slide(id),
    })

    form.value = {
      name: response.data.name,
      url: response.data.url,
      image: response.data.image,
      mobileImage: response.data.mobileImage,
    }
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

    if (form.value.mobileImage instanceof File) {
      formData.append('mobileImage', form.value.mobileImage)
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.update_main_banner_slide(id),
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
      mobileImage: null,
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
const mobilePreviewUrl = ref(null)

const handleFileUpload = (event, field, previewRef) => {
  if (previewRef.value) {
    URL.revokeObjectURL(previewRef.value)
  }

  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    previewRef.value = URL.createObjectURL(file)
    form.value[field] = file
  } else {
    previewRef.value = null
    form.value[field] = null
  }
}

const handleDesktopUpload = event => handleFileUpload(event, 'image', previewUrl)
const handleMobileUpload = event => handleFileUpload(event, 'mobileImage', mobilePreviewUrl)

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  if (mobilePreviewUrl.value) {
    URL.revokeObjectURL(mobilePreviewUrl.value)
  }
})

onMounted(fetchSlide)
</script>

<template>
  <AppHelpModal
    v-model:isOpen="isModalOpen"
    :content-type="helpModalType"
    @close="isModalOpen = false"
  />

  <div class="overflow-x-auto bg-gray-900 p-4 rounded-lg">

    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Редактирование слайда главного баннера
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
            <label class="flex text-sm font-medium text-gray-200 mb-2">
              URL
              <div
                class="ml-2 w-4 h-4 bg-indigo-600 rounded-4xl text-center text-xs cursor-pointer"
                @click="openHelpModal('link')"
              >
                ?
              </div>
            </label>
            <input
              v-model="form.url"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите URL"
            />
          </div>


          <div class="w-80 mb-4 mr-4">
            <label class="flex text-sm font-medium text-gray-200 mb-2">
              Desktop изображение 21:9 <span class="text-red-600 ml-1">*</span>
              <div
                class="ml-2 w-4 h-4 bg-indigo-600 rounded-4xl text-center text-xs cursor-pointer"
                @click="openHelpModal('image')"
              >
                ?
              </div>
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleDesktopUpload"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2 bg-gray-800 cursor-pointer"
            />
            <p class="mt-2 text-xs leading-5 text-blue-200">
              Для компьютеров: 21:9. Рекомендуем 2560x1080 px или 2100x900 px.
            </p>
            <p v-if="errors.image" class="text-red-600 text-sm">
              {{ errors.image }}
            </p>
          </div>

          <div class="w-80 mb-4 mr-4">
            <label class="flex text-sm font-medium text-gray-200 mb-2">
              Телефон/планшет изображение 16:9 <span class="text-red-600 ml-1">*</span>
              <div
                class="ml-2 w-4 h-4 bg-indigo-600 rounded-4xl text-center text-xs cursor-pointer"
                @click="openHelpModal('image')"
              >
                ?
              </div>
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleMobileUpload"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2 bg-gray-800 cursor-pointer"
            />
            <p class="mt-2 text-xs leading-5 text-blue-200">
              Для телефонов и планшетов: 16:9. Рекомендуем 1920x1080 px или 1280x720 px.
            </p>
            <p v-if="errors.mobileImage" class="text-red-600 text-sm">
              {{ errors.mobileImage }}
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

      <div class="mt-4 grid w-full gap-5 sm:ml-10 lg:max-w-xl">
        <div v-if="previewUrl || form.image" class="overflow-hidden">
          <p class="mb-2 text-sm text-gray-300">Desktop preview 21:9</p>
          <img
            :src="previewUrl || resolveMediaUrl(form.image)"
            alt="Desktop preview"
            class="aspect-[21/9] w-full rounded border border-gray-700 object-cover object-center"
          />
        </div>

        <div v-if="mobilePreviewUrl || form.mobileImage || form.image" class="overflow-hidden">
          <p class="mb-2 text-sm text-gray-300">Mobile/tablet preview 16:9</p>
          <img
            :src="mobilePreviewUrl || resolveMediaUrl(form.mobileImage || form.image)"
            alt="Mobile/tablet preview"
            class="aspect-[16/9] w-full rounded border border-gray-700 object-cover object-center"
          />
          <p v-if="!form.mobileImage" class="mt-2 text-xs text-amber-300">
            У этого старого слайда пока нет отдельной mobile/tablet картинки. До загрузки новой будет использоваться desktop изображение.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
