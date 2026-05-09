<script setup>
/*
 * Products List
 * Показывает товары с поиском и фильтрами по скидкам, категориям и остаткам.
 */
import AppEmpty from '@/components/AppEmpty.vue'
import AppLoader from '@/components/AppLoader.vue'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useGlobalStore } from '@/stores/global'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const globalStore = useGlobalStore()

const loading = ref(false)
const currentPage = ref(1)
const limit = ref(15)
const products = ref([])
const categories = ref([])
const meta = ref(null)
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')
const filters = ref({
  search: '',
  discount: '',
  category: '',
  stock: '',
})
let searchTimer = null

const hasActiveFilters = computed(() =>
  Boolean(filters.value.search || filters.value.discount || filters.value.category || filters.value.stock),
)

const formatPrice = (value) => `${Number(value || 0).toLocaleString('ru-RU')} тмт`
const formatDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ashgabat',
  }).format(new Date(value))
}

const discountLabel = (product) => {
  if (product.hasDiscount) {
    return product.discountExpiresAt
      ? `Активна до ${formatDate(product.discountExpiresAt)}`
      : 'Активна без срока'
  }

  if (product.discountPrice && product.discountExpiresAt) {
    return `Истекла ${formatDate(product.discountExpiresAt)}`
  }

  return 'Без скидки'
}

const discountClass = (product) => {
  if (product.hasDiscount) return 'bg-red-500/10 text-red-300 ring-red-400/20'
  if (product.discountPrice && product.discountExpiresAt) return 'bg-amber-500/10 text-amber-200 ring-amber-400/20'
  return 'bg-slate-800 text-slate-400 ring-slate-700'
}

const stockClass = (stock) => {
  if (stock <= 0) return 'bg-red-500/10 text-red-300 ring-red-400/20'
  if (stock <= 5) return 'bg-amber-500/10 text-amber-200 ring-amber-400/20'
  return 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20'
}

const fetchCategories = async () => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.categoriesForList,
    })
    categories.value = response.data || []
  } catch (e) {
    console.error('fetchCategories failed:', e)
    categories.value = []
  }
}

const fetchData = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.products,
      params: {
        page: currentPage.value,
        limit: limit.value,
        search: filters.value.search || undefined,
        discount: filters.value.discount || undefined,
        category: filters.value.category || undefined,
        stock: filters.value.stock || undefined,
      },
    })

    products.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchProducts failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
  if (meta.value?.hasNext) {
    currentPage.value++
    fetchData()
  }
}

const prevPage = () => {
  if (meta.value?.hasPrev) {
    currentPage.value--
    fetchData()
  }
}

const pageChange = (page) => {
  currentPage.value = page
  fetchData()
}

const applyFilters = () => {
  currentPage.value = 1
  fetchData()
}

const handleSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(applyFilters, 350)
}

const resetFilters = () => {
  filters.value = {
    search: '',
    discount: '',
    category: '',
    stock: '',
  }
  applyFilters()
}

const handleConfirm = async () => {
  try {
    isModalOpen.value = false
    loading.value = true

    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_product(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.name}" успешно удален!`)
    fetchData()
  } catch (e) {
    console.error('Delete product failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const deleteDataButt = (data) => {
  deleteData.value = data
  modalTitle.value = `Удалить продукт "${data.name}"?`
  isModalOpen.value = true
}

onMounted(() => {
  fetchCategories()
  fetchData()
})
</script>

<template>
  <section class="space-y-5">
    <AppModal
      v-model:isOpen="isModalOpen"
      :title="modalTitle"
      @close="isModalOpen = false"
      @confirm="handleConfirm"
    />

    <div class="rounded-2xl border border-slate-800 bg-gray-900 p-4 text-white sm:p-6">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-sky-400">Товары</p>
          <h1 class="mt-2 text-2xl font-bold sm:text-3xl">Список товаров</h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-400">
            Поиск и фильтры помогают быстро найти товары со скидкой, нужной категорией или заканчивающимся остатком.
          </p>
        </div>

        <RouterLink
          to="/products/create"
          class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Добавить товар
        </RouterLink>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label class="block xl:col-span-2">
          <span class="text-xs uppercase tracking-wide text-slate-500">Поиск</span>
          <input
            v-model="filters.search"
            class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
            placeholder="Название товара"
            @input="handleSearchInput"
          />
        </label>

        <label class="block">
          <span class="text-xs uppercase tracking-wide text-slate-500">Скидки</span>
          <select
            v-model="filters.discount"
            class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
            @change="applyFilters"
          >
            <option value="">Все</option>
            <option value="active">Активные скидки</option>
            <option value="expired">Истекшие скидки</option>
            <option value="none">Без скидки</option>
          </select>
        </label>

        <label class="block">
          <span class="text-xs uppercase tracking-wide text-slate-500">Категория</span>
          <select
            v-model="filters.category"
            class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
            @change="applyFilters"
          >
            <option value="">Все категории</option>
            <option v-for="category in categories" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-xs uppercase tracking-wide text-slate-500">Остаток</span>
          <select
            v-model="filters.stock"
            class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
            @change="applyFilters"
          >
            <option value="">Любой</option>
            <option value="inStock">В наличии</option>
            <option value="lowStock">Заканчивается</option>
            <option value="outOfStock">Нет в наличии</option>
          </select>
        </label>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-400">
          Найдено: <span class="font-bold text-white">{{ meta?.total || 0 }}</span>
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
          @click="resetFilters"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-800 bg-gray-900 text-white">
      <AppEmpty v-if="!loading && !products.length" />

      <div v-else class="divide-y divide-slate-800 md:hidden">
        <article v-for="product in products" :key="product._id" class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-bold">{{ product.name }}</h2>
              <p class="mt-1 text-sm text-slate-400">
                {{ formatPrice(product.price) }}
              </p>
            </div>
            <span
              class="rounded-full px-2 py-1 text-xs font-bold ring-1"
              :class="stockClass(product.stock)"
            >
              {{ product.stock }} шт.
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span
              class="rounded-full px-2 py-1 text-xs font-bold ring-1"
              :class="discountClass(product)"
            >
              {{ discountLabel(product) }}
            </span>
            <span
              v-for="category in product.categories"
              :key="category._id"
              class="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300"
            >
              {{ category.name }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <RouterLink
              :to="`/products/edit/${product._id}`"
              class="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white"
            >
              Edit
            </RouterLink>
            <button
              class="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white"
              @click="deleteDataButt(product)"
            >
              Delete
            </button>
          </div>
        </article>
      </div>

      <div v-if="products.length" class="hidden overflow-x-auto md:block">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-950 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Товар</th>
              <th class="px-4 py-3">Категории</th>
              <th class="px-4 py-3 text-right">Цена</th>
              <th class="px-4 py-3 text-center">Остаток</th>
              <th class="px-4 py-3">Скидка</th>
              <th class="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="product in products" :key="product._id" class="align-top">
              <td class="px-4 py-4">
                <div class="font-bold">{{ product.name }}</div>
                <div class="mt-1 font-mono text-xs text-slate-500">{{ product._id }}</div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="category in product.categories"
                    :key="category._id"
                    class="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300"
                  >
                    {{ category.name }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="font-bold">{{ formatPrice(product.price) }}</div>
                <div v-if="product.hasDiscount" class="text-xs text-slate-500 line-through">
                  {{ formatPrice(product.originalPrice) }}
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <span
                  class="rounded-full px-2 py-1 text-xs font-bold ring-1"
                  :class="stockClass(product.stock)"
                >
                  {{ product.stock }} шт.
                </span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-bold ring-1"
                  :class="discountClass(product)"
                >
                  {{ discountLabel(product) }}
                </span>
                <div v-if="product.hasDiscount" class="mt-1 text-xs text-red-300">
                  -{{ product.discountPercent }}%
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex justify-end gap-2">
                  <RouterLink
                    :to="`/products/edit/${product._id}`"
                    class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    Edit
                  </RouterLink>
                  <button
                    class="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                    @click="deleteDataButt(product)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="products.length" class="border-t border-slate-800 p-4">
        <AppPagination
          :meta="meta"
          @prev-page="prevPage"
          @next-page="nextPage"
          @pageChange="pageChange"
        />
      </div>
    </div>

    <AppLoader v-if="loading">Загружаем продукты...</AppLoader>
  </section>
</template>
