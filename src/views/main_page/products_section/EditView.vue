<script setup>
/*
 * Product Section Edit
 * Редактирует секцию товаров и обновляет выбранные позиции.
 */
import { useGlobalStore } from '@/stores/global'
import { onMounted, ref } from 'vue'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
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


const isLoadingProductSearch = ref(false)
const lastQueryProdSearch = ref('')
const submitting = ref(false)
const success = ref(false)


const form = ref({
  position: 1,
})
const productSearchResult = ref([])
const isNew = ref(false)


const schema = yup.object({
  nameRU: yup.string().required('Пожалуйста заполните поле'),
})


const fetchSlide = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.section(id),
    })

    form.value = {
      nameRU: response.data.name.ru,
      nameTM: response.data.name.tm,
      nameEN: response.data.name.en,
      products: response.data.products,
      position: response.data.position || 1,
    }

    if (response.data.products && response.data.products.length == 0) {
      isNew.value = true
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
      name: {
        ru: form.value.nameRU,
        tm: form.value.nameTM,
        en: form.value.nameEN,
      },
      products: !isNew.value
        ? form.value.products && form.value.products.length > 0
          ? form.value.products.map((el) => el.id)
          : []
        : [],
      position: form.value.position,
    }

    await globalStore.makeApiRequest({
      method: 'POST',
      url: globalStore.api.endpoints.update_products_section(id),
      data: data,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    success.value = true
    toast.success('Секция успешно обновлена!')
    router.back()
    form.value = {
      position: 1,
    }
  } catch (e) {
    console.error('Edit section failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(fetchSlide)
</script>

<template>
  <div class="bg-gray-900 p-4 rounded-lg">

    <div class="flex items-center mt-2">
      <span class="shrink-0 pe-4 text-gray-900 dark:text-white black text-xl">
        Создание Секции товаров
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
              Название секции RU <span class="text-red-600">*</span>
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
            <label class="block text-sm font-medium text-gray-200 mb-2"> Название секции TM </label>
            <input
              v-model="form.nameTM"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите название на Туркменском"
            />
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200 mb-2"> Название секции EN </label>
            <input
              v-model="form.nameEN"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="Введите название на Английском"
            />
          </div>


          <div class="w-55 flex justify-center">
            <label for="Option1" class="flex items-center gap-3">
              <input
                v-model="isNew"
                type="checkbox"
                class="size-5 rounded border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-900 dark:ring-offset-gray-900 dark:checked:bg-blue-600"
                id="Option1"
              />

              <span class="font-medium text-gray-700 dark:text-gray-200"> Секция "Новинки" </span>
            </label>
          </div>


          <div class="w-65 mb-4 mr-4" v-if="!isNew">
            <label class="block text-sm font-medium text-gray-200 mb-2">
              Продукты (максимум 8)
            </label>
            <VueMultiselect
              v-model="form.products"
              :options="productSearchResult"
              :multiple="true"
              :searchable="true"
              :loading="isLoadingProductSearch"
              :internal-search="false"
              :close-on-select="false"
              :clear-on-select="false"
              :preserve-search="true"
              :hide-selected="true"
              :max="8"
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
          </div>


          <div class="w-65 mb-4 mr-4">
            <label class="block text-sm font-medium text-gray-200"> Позиция </label>
            <input
              v-model="form.position"
              type="text"
              class="mt-2 w-full rounded border border-gray-500 focus:border-indigo-600 focus:outline-none shadow-sm text-sm text-white p-2"
              placeholder="0"
            />
          </div>
        </div>


        <div class="flex flex-wrap flex-row mt-5">
          <button
            type="submit"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors cursor-pointer"
            :disabled="submitting"
          >
            {{ submitting ? 'Отправка...' : 'Обновить секцию' }}
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

<style>

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
