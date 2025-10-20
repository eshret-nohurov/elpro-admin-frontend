<script setup>
import { useGlobalStore } from '@/stores/global'
import { onMounted, ref } from 'vue'
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
  categories: [],
  stock: 1000,
})
const categories = ref([])
const productSearchResult = ref([])
const specifications = ref([
  {
    type: { ru: '', tm: '', en: '' },
    value: { ru: '', tm: '', en: '' },
  },
])

const isLoadingProductSearch = ref(false)
const lastQueryProdSearch = ref('')

// ==========

// Ошибки
const errors = ref({})

// Состояние
const loading = ref(false)
const submitting = ref(false)
const success = ref(false)

// Схема валидации
const schema = yup.object({
  nameRU: yup.string().required('Пожалуйста заполните поле'),
  shortDesсRU: yup.string().required('Пожалуйста заполните поле'),
  fullDesсRU: yup.string().required('Пожалуйста заполните поле'),
  price: yup.string().required('Пожалуйста заполните поле'),
  stock: yup.string().required('Пожалуйста заполните поле'),
  images: yup.mixed().required('Пожалуйста загрузите изображение'),
  relatedProducts: yup.array().max(4, 'Можно выбрать не более 4 товаров').nullable(),
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
    const name = {
      ru: form.value.nameRU,
      tm: form.value.nameTM,
      en: form.value.nameEN,
    }

    const shortDescription = {
      ru: form.value.shortDesсRU,
      tm: form.value.shortDesсTM,
      en: form.value.shortDesсEN,
    }

    const fullDescription = {
      ru: form.value.fullDesсRU,
      tm: form.value.fullDesсTM,
      en: form.value.fullDesсEN,
    }

    const preparedSpecs = specifications.value.map((spec) => ({
      type: {
        ru: spec.type.ru.trim(),
        tm: spec.type.tm?.trim() || spec.type.ru.trim(),
        en: spec.type.en?.trim() || spec.type.ru.trim(),
      },
      value: {
        ru: spec.value.ru.trim(),
        tm: spec.value.tm?.trim() || spec.value.ru.trim(),
        en: spec.value.en?.trim() || spec.value.ru.trim(),
      },
    }))

    const formData = new FormData()
    formData.append('name', JSON.stringify(name))
    formData.append('shortDescription', JSON.stringify(shortDescription))
    formData.append('fullDescription', JSON.stringify(fullDescription))
    formData.append('price', form.value.price)
    formData.append('stock', form.value.stock)
    formData.append('categories', JSON.stringify(form.value.categories.map((el) => el.value)))
    if (form.value.relatedProducts && form.value.relatedProducts.length > 0) {
      formData.append(
        'relatedProducts',
        JSON.stringify(form.value.relatedProducts.map((el) => el.id)),
      )
    }
    formData.append('specifications', JSON.stringify(preparedSpecs))
    if (form.value.images) {
      for (let i = 0; i < form.value.images.length; i++) {
        formData.append('images', form.value.images[i])
      }
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.create_product,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    success.value = true
    toast.success('Товар успешно создан!')
    setTimeout(() => {
      router.back()
    }, 1000)
    form.value = {}
  } catch (e) {
    console.error('Created product failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
  }
}

// GET DATA
const fetchCategory = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.categoriesForList,
    })

    categories.value = response.data
    console.log(categories.value)
  } catch (e) {
    console.error('fetchCategory failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const handleInputChangeForProducts = async (val) => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.search_products,
      params: {
        query: val,
      },
    })

    productSearchResult.value = response.results
  } catch (e) {
    console.error('handleInputChangeForProducts failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  }
}

let searchTimeout = null
const handleSearchProduct = async (query) => {
  lastQueryProdSearch.value = query

  clearTimeout(searchTimeout)

  if (query.length < 3) {
    productSearchResult.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    isLoadingProductSearch.value = true

    try {
      await handleInputChangeForProducts(query)
    } catch (error) {
      console.error('Ошибка при поиске продукта:', error)
      productSearchResult.value = []
    } finally {
      isLoadingProductSearch.value = false
    }
  }, 500)
}

//! specifications
const addSpecification = () => {
  specifications.value.push({
    type: { ru: '', tm: '', en: '' },
    value: { ru: '', tm: '', en: '' },
  })
}

const removeSpecification = (index) => {
  if (specifications.value.length > 1) {
    specifications.value.splice(index, 1)
  }
}

// Превью изображения
const handleFileUpload = (event) => {
  try {
    const files = event.target.files

    // Проверяем, что файлы выбраны
    if (!files || files.length === 0) {
      form.value.images = null
      return
    }

    // Преобразуем FileList в массив и фильтруем только изображения
    const imageFiles = Array.from(files).filter((file) => file?.type?.startsWith('image/'))

    // Проверяем количество файлов
    if (imageFiles.length > 4) {
      alert('Можно загрузить не более 4 изображений')
      event.target.value = '' // Сбрасываем input
      form.value.images = null
      return
    }

    // Проверяем, что есть хотя бы 1 изображение
    if (imageFiles.length === 0) {
      alert('Пожалуйста, выберите изображения')
      form.value.images = null
      return
    }

    // Сохраняем файлы в form
    form.value.images = imageFiles
  } catch (error) {
    console.error('Ошибка загрузки файлов:', error)
    form.value.images = null
    event.target.value = '' // Сбрасываем input
  }
}

onMounted(fetchCategory)
</script>

<template>
  <div class="bg-gray-900 p-4 rounded-lg">
    <!-- head -->
    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Создание товара
      </span>

      <span
        class="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"
      ></span>
    </div>

    <!-- body -->
    <form class="mt-10" @submit.prevent="submitForm">
      <div class="flex flex-wrap flex-row gap-10">
        <!-- ============================================ -->
        <!-- SIDE 1 -->
        <!-- ============================================ -->
        <div class="max-w-full">
          <!-- Строка inputs -->
          <div class="flex flex-wrap flex-row">
            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Название товара RU <span class="text-red-600">*</span>
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
                Название товара TM
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
                Название товара EN
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
          <div class="flex flex-wrap flex-row">
            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Короткое описание RU <span class="text-red-600">*</span>
              </label>
              <textarea
                v-model="form.shortDesсRU"
                :class="[
                  'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                  errors.shortDesсRU ? 'border-red-600' : '',
                ]"
                rows="5"
              ></textarea>
              <p v-if="errors.shortDesсRU" class="text-red-600 text-sm mt-1 px-1">
                {{ errors.shortDesсRU }}
              </p>
            </div>

            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Короткое описание TM
              </label>
              <textarea
                v-model="form.shortDescTM"
                class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                rows="5"
              ></textarea>
            </div>

            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Короткое описание EN
              </label>
              <textarea
                v-model="form.shortDescEN"
                class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                rows="5"
              ></textarea>
            </div>
          </div>

          <!-- Строка inputs -->
          <div class="flex flex-wrap flex-row">
            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Полное описание RU <span class="text-red-600">*</span>
              </label>
              <textarea
                v-model="form.fullDesсRU"
                :class="[
                  'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                  errors.fullDesсRU ? 'border-red-600' : '',
                ]"
                rows="5"
              ></textarea>
              <p v-if="errors.fullDesсRU" class="text-red-600 text-sm mt-1 px-1">
                {{ errors.fullDesсRU }}
              </p>
            </div>

            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Полное описание TM
              </label>
              <textarea
                v-model="form.fullDesсTM"
                class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                rows="5"
              ></textarea>
            </div>

            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Полное описание EN
              </label>
              <textarea
                v-model="form.fullDesсEN"
                class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                rows="5"
              ></textarea>
            </div>
          </div>

          <!-- Строка inputs -->
          <div class="flex flex-wrap flex-row">
            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Цена <span class="text-red-600">*</span>
              </label>
              <input
                v-model="form.price"
                type="number"
                :class="[
                  'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                  errors.price ? 'border-red-600' : '',
                ]"
              />
              <p v-if="errors.price" class="text-red-600 text-sm mt-1 px-1">
                {{ errors.price }}
              </p>
            </div>

            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Количество <span class="text-red-600">*</span>
              </label>
              <input
                v-model="form.stock"
                type="number"
                :class="[
                  'mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2',
                  errors.stock ? 'border-red-600' : '',
                ]"
              />
              <p v-if="errors.stock" class="text-red-600 text-sm mt-1 px-1">
                {{ errors.stock }}
              </p>
            </div>

            <!-- input for image upload -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Изображение товара <span class="text-red-600">*</span>
                <span class="text-gray-400 text-xs ml-1">(Макс. 4 файла)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                @change="handleFileUpload"
                class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2 bg-gray-800 cursor-pointer"
              />
              <p v-if="errors.images" class="text-red-600 text-sm">
                {{ errors.images }}
              </p>
            </div>
          </div>

          <!-- Строка inputs -->
          <div class="flex flex-wrap flex-row">
            <!-- select -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Категории <span class="text-red-600">*</span>
              </label>
              <VueMultiselect
                v-model="form.categories"
                :options="categories"
                :multiple="true"
                :close-on-select="false"
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
              <p v-if="errors.category" class="text-red-600 text-sm">
                {{ errors.category }}
              </p>
            </div>

            <!-- input -->
            <div class="w-65 mb-4 mr-4">
              <label class="block text-sm font-medium text-gray-200 mb-2">
                Связанные продукты (максимум 4)
              </label>
              <VueMultiselect
                v-model="form.relatedProducts"
                :options="productSearchResult"
                :multiple="true"
                :searchable="true"
                :loading="isLoadingProductSearch"
                :internal-search="false"
                :close-on-select="false"
                :clear-on-select="false"
                :preserve-search="true"
                :hide-selected="true"
                :max="4"
                open-direction="bottom"
                @search-change="handleSearchProduct"
                label="name"
                track-by="id"
                placeholder="Выберите элементы"
                select-label="Выбрать"
                selected-label="Выбрано"
                deselect-label="Удалить"
              >
                <template #noOptions>
                  <div v-if="lastQueryProdSearch.length < 3" class="text-sm">
                    Введите минимум 3 символа для поиска
                  </div>
                  <div v-else class="text-sm">Ничего не найдено</div>
                </template>
              </VueMultiselect>
              <p v-if="errors.relatedProducts" class="text-red-600 text-sm mt-1 px-1">
                {{ errors.relatedProducts }}
              </p>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- SIDE 2 -->
        <!-- ============================================ -->
        <div class="min-w-200">
          <div class="mb-6">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-medium text-gray-200">Характеристики товара</h3>
              <button
                type="button"
                @click="addSpecification"
                class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
              >
                + Добавить характеристику
              </button>
            </div>

            <div
              v-for="(spec, index) in specifications"
              :key="index"
              class="mb-4 p-4 border border-gray-700 rounded-lg"
            >
              <div class="flex justify-between items-center mb-3">
                <span class="text-gray-300">Характеристика #{{ index + 1 }}</span>
                <button
                  type="button"
                  @click="removeSpecification(index)"
                  class="text-red-500 hover:text-red-400 cursor-pointer"
                  :disabled="specifications.length <= 1"
                >
                  Удалить
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Тип характеристики -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">
                    Тип (RU)
                    <span class="text-red-600">*</span>
                  </label>
                  <input
                    v-model="spec.type.ru"
                    type="text"
                    class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                    required
                  />
                </div>

                <!-- Значение характеристики -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">
                    Значение (RU)
                    <span class="text-red-600">*</span>
                  </label>
                  <input
                    v-model="spec.value.ru"
                    type="text"
                    class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                    required
                  />
                </div>

                <!-- Тип характеристики -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Тип (TM)</label>
                  <input
                    v-model="spec.type.tm"
                    type="text"
                    class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                  />
                </div>

                <!-- Значение характеристики -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Значение (TM)</label>
                  <input
                    v-model="spec.value.tm"
                    type="text"
                    class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                  />
                </div>

                <!-- Тип характеристики -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Тип (EN)</label>
                  <input
                    v-model="spec.type.en"
                    type="text"
                    class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                  />
                </div>

                <!-- Значение характеристики -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Значение (EN)</label>
                  <input
                    v-model="spec.value.en"
                    type="text"
                    class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Строка BUTTONS -->
      <div class="flex flex-wrap flex-row mt-5">
        <button
          type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors cursor-pointer"
          :disabled="submitting"
        >
          {{ submitting ? 'Отправка...' : 'Создать товар' }}
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
