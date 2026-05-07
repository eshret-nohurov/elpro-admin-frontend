<script setup>
import { useGlobalStore } from '@/stores/global'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
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
  position: 1,
})

const categories = ref([])

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
    formData.append('parentId', form.value.categories ? form.value.categories.value : '')
    formData.append('position', form.value.position)
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
      position: 1,
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

// GET DATA
const fetchCategoryForList = async () => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.categoriesForList,
    })

    categories.value = response.data
    console.log(categories.value)
  } catch (e) {
    console.error('fetchCategoryForSubcategory failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
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

onMounted(fetchCategoryForList)

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="overflow-x-auto bg-gray-900 p-4 rounded-lg h-full">
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

          <!-- select -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Родительская категория
            </label>
            <VueMultiselect
              v-model="form.categories"
              :options="categories"
              :multiple="false"
              :close-on-select="true"
              :clear-on-select="false"
              :hide-selected="true"
              open-direction="bottom"
              label="label"
              track-by="value"
              placeholder="Выберите элементы"
              select-label="Выбрать"
              selected-label="Выбрано"
              deselect-label="Удалить"
            >
              <template #noOptions>
                <div class="text-sm">Ничего не найдено</div>
              </template>
            </VueMultiselect>
          </div>
        </div>

        <!-- Строка inputs -->
        <div class="flex flex-wrap flex-row mt-5">
          <!-- input -->
          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2"> Позиция </label>
            <input
              v-model="form.position"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="0"
            />
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

<style>
/* Стили поля ввода и тегов */
.multiselect__tags {
  background-color: #101828;
  border: 1px solid #6a7282;
  color: white;
}

.multiselect__tags .multiselect__tags-wrap .multiselect__tag {
  background: #4f39f6;
}

.multiselect__tags .multiselect__tags-wrap .multiselect__tag .multiselect__tag-icon::after {
  color: rgba(255, 255, 255);
}

.multiselect__placeholder {
  color: white;
}

.multiselect__input {
  background-color: #101828;
  color: white;
  padding: 0;
  font-size: 14px;
}

.multiselect__input,
.multiselect__single {
  background: #4f39f6;
  font-size: 14px;
}

.multiselect__input::placeholder {
  color: white;
  font-size: 14px;
}

.multiselect__input:focus {
  outline: none;
  border-color: #4f46e5;
}

.multiselect__content-wrapper {
  background: #101828;
  border: 1px solid #6a7282;
  color: white;
  overflow: hidden;
}

.multiselect__content-wrapper .multiselect__option {
  white-space: normal;
  line-height: 140%;
}

.multiselect__content-wrapper .multiselect__option--highlight {
  background: #4f46e5;
}

.multiselect__content-wrapper .multiselect__option--highlight::after {
  background: #4f46e5;
}
</style>
