<script setup>
/*
 * Order Form
 * Создает и редактирует заказы из админки, пересчитывает доставку и показывает скидки товаров.
 */
import AppLoader from '@/components/AppLoader.vue'
import { useGlobalStore } from '@/stores/global'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const globalStore = useGlobalStore()

const isEdit = computed(() => Boolean(route.params.id))
const loading = ref(false)
const saving = ref(false)
const productSearch = ref('')
const productSearchResults = ref([])
const isProductSearchLoading = ref(false)
const deliveryPrices = ref({})
const usdToTmtRate = ref(0)
const orderMeta = ref({
  createdAt: null,
  updatedAt: null,
})
let searchTimeout = null

const form = ref({
  location: 'Ашхабад',
  isPickup: false,
  address: '',
  name: '',
  phone: '',
  email: '',
  comment: '',
  status: 'pending',
  products: [],
})

const statusOptions = [
  { value: 'pending', label: 'Новый' },
  { value: 'processing', label: 'В обработке' },
  { value: 'completed', label: 'Завершен' },
  { value: 'cancelled', label: 'Отменен' },
]

const locationOptions = [
  'Ашхабад',
  'Аркадаг',
  'Ахалский велаят',
  'Балканский велаят',
  'Ташаузский велаят',
  'Лебабский велаят',
  'Марыйский велаят',
]

const subtotalPrice = computed(() =>
  form.value.products.reduce(
    (total, product) => total + Number(product.price || 0) * Number(product.quantity || 0),
    0,
  ),
)
const deliveryPrice = computed(() => {
  if (form.value.isPickup) return 0
  return Number(deliveryPrices.value?.[form.value.location] || 0)
})
const totalPrice = computed(() => subtotalPrice.value + deliveryPrice.value)

const formatPrice = (value) => `${Number(value || 0).toLocaleString('ru-RU')} тмт`
const formatUsd = (value) => `$${Number(value || 0).toLocaleString('en-US', {
  maximumFractionDigits: 2,
})}`
const formatPriceWithUsd = (value) => {
  const tmtValue = Number(value || 0)
  const rate = Number(usdToTmtRate.value || 0)

  if (!rate) return formatPrice(tmtValue)

  return `${formatPrice(tmtValue)} (${formatUsd(tmtValue / rate)})`
}
const productUsdToTmt = (value) => {
  const rate = Number(usdToTmtRate.value || 0)
  return Number(value || 0) * (rate || 1)
}
const originalPrice = (product) => Number(product.originalPrice || product.price || 0)
const productDiscountTotal = (product) =>
  product.hasDiscount
    ? (originalPrice(product) - Number(product.price || 0)) * Number(product.quantity || 0)
    : 0
const formatDiscountDate = (value) => {
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
const formatDate = (value) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ashgabat',
  }).format(new Date(value))
}
const wasEdited = computed(() => {
  if (!orderMeta.value.createdAt || !orderMeta.value.updatedAt) return false

  const createdAt = new Date(orderMeta.value.createdAt).getTime()
  const updatedAt = new Date(orderMeta.value.updatedAt).getTime()
  return updatedAt - createdAt > 1000
})

const fetchSettings = async () => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.settings,
    })
    deliveryPrices.value = response.data?.[0]?.deliveryPrices || {}
    usdToTmtRate.value = Number(response.data?.[0]?.usdToTmtRate || 0)
  } catch (e) {
    console.error('fetchSettings failed:', e)
  }
}

const fetchOrder = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.order(route.params.id),
    })

    const order = response.data
    orderMeta.value = {
      createdAt: order.createdAt || null,
      updatedAt: order.updatedAt || null,
    }
    form.value = {
      location: order.location || 'Ашхабад',
      isPickup: Boolean(order.isPickup),
      address: order.address || '',
      name: order.name || '',
      phone: order.phone || '',
      email: order.email || '',
      comment: order.comment || '',
      status: order.status || 'pending',
      products: (order.products || []).map((product) => ({
        _id: product._id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        hasDiscount: Boolean(product.hasDiscount),
        discountPercent: product.discountPercent || 0,
        discountExpiresAt: product.discountExpiresAt || null,
      })),
    }
  } catch (e) {
    console.error('fetchOrder failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const searchProducts = async (query) => {
  productSearch.value = query
  clearTimeout(searchTimeout)

  if (query.trim().length < 2) {
    productSearchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      isProductSearchLoading.value = true
      const response = await globalStore.makeApiRequest({
        method: 'GET',
        url: globalStore.api.endpoints.search_products,
        params: { query },
      })

      productSearchResults.value = response.results || []
    } catch (e) {
      console.error('searchProducts failed:', e)
      productSearchResults.value = []
    } finally {
      isProductSearchLoading.value = false
    }
  }, 300)
}

const addProduct = (product) => {
  const existingProduct = form.value.products.find((item) => item._id === product.id)

  if (existingProduct) {
    existingProduct.quantity += 1
  } else {
    form.value.products.push({
      _id: product.id,
      name: product.name,
      quantity: 1,
      price: productUsdToTmt(product.price),
      originalPrice: productUsdToTmt(product.originalPrice || product.price),
      hasDiscount: Boolean(product.hasDiscount),
      discountPercent: product.discountPercent || 0,
      discountExpiresAt: product.discountExpiresAt || null,
    })
  }

  productSearch.value = ''
  productSearchResults.value = []
}

const addEmptyProduct = () => {
  form.value.products.push({
    _id: `manual-${Date.now()}`,
    name: '',
    quantity: 1,
    price: 0,
    originalPrice: null,
    hasDiscount: false,
    discountPercent: 0,
    discountExpiresAt: null,
  })
}

const removeProduct = (index) => {
  form.value.products.splice(index, 1)
}

const submitForm = async () => {
  try {
    saving.value = true

    await globalStore.makeApiRequest({
      method: 'POST',
      url: isEdit.value
        ? globalStore.api.endpoints.update_order(route.params.id)
        : globalStore.api.endpoints.create_order,
      data: {
        ...form.value,
        subtotalPrice: subtotalPrice.value,
        deliveryPrice: deliveryPrice.value,
        totalPrice: totalPrice.value,
      },
    })

    toast.success(isEdit.value ? 'Заказ обновлен' : 'Заказ создан')
    router.push('/orders')
  } catch (e) {
    console.error('saveOrder failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
  fetchOrder()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-gray-900 p-4 text-white sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-sky-400">Заказы</p>
        <h1 class="mt-2 text-2xl font-bold sm:text-3xl">
          {{ isEdit ? 'Редактировать заказ' : 'Создать заказ' }}
        </h1>
        <div v-if="isEdit" class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span class="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
            Создан {{ formatDate(orderMeta.createdAt) }}
          </span>
          <span
            class="rounded-full px-3 py-1"
            :class="wasEdited ? 'bg-amber-500/10 text-amber-200' : 'bg-slate-800 text-slate-500'"
          >
            Изменен {{ wasEdited ? formatDate(orderMeta.updatedAt) : 'не редактировался' }}
          </span>
        </div>
      </div>

      <RouterLink
        to="/orders"
        class="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
      >
        Назад к заказам
      </RouterLink>
    </div>

    <form class="grid gap-5 xl:grid-cols-[1fr_420px]" @submit.prevent="submitForm">
      <div class="space-y-5 rounded-2xl border border-slate-800 bg-gray-900 p-4 text-white sm:p-6">
        <h2 class="text-lg font-bold">Данные клиента</h2>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="text-sm text-slate-400">Фамилия, имя *</span>
            <input
              v-model="form.name"
              required
              class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-sky-500"
              placeholder="Дурды Дурдыев"
            />
          </label>

          <label class="block">
            <span class="text-sm text-slate-400">Телефон *</span>
            <input
              v-model="form.phone"
              required
              class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-sky-500"
              placeholder="+993 (65) 12-34-56"
            />
          </label>

          <label class="block">
            <span class="text-sm text-slate-400">Email</span>
            <input
              v-model="form.email"
              type="email"
              class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-sky-500"
              placeholder="client@gmail.com"
            />
          </label>

          <label class="block">
            <span class="text-sm text-slate-400">Статус</span>
            <select
              v-model="form.status"
              class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 pr-10 text-white outline-none focus:border-sky-500"
            >
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="text-sm text-slate-400">Город *</span>
            <select
              v-model="form.location"
              required
              class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 pr-10 text-white outline-none focus:border-sky-500"
            >
              <option v-for="location in locationOptions" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </label>

          <label class="flex items-end gap-3 rounded-xl border border-slate-800 bg-gray-950 p-4">
            <input v-model="form.isPickup" type="checkbox" class="size-5" />
            <span class="font-medium">Самовывоз</span>
          </label>
        </div>

        <label class="block">
          <span class="text-sm text-slate-400">Адрес доставки</span>
          <input
            v-model="form.address"
            :required="!form.isPickup"
            :disabled="form.isPickup"
            class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-sky-500 disabled:opacity-50"
            placeholder="Введите адрес доставки"
          />
        </label>

        <label class="block">
          <span class="text-sm text-slate-400">Комментарий</span>
          <textarea
            v-model="form.comment"
            class="mt-2 min-h-32 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-sky-500"
            placeholder="Комментарий к заказу"
          ></textarea>
        </label>
      </div>

      <aside class="space-y-5 rounded-2xl border border-slate-800 bg-gray-900 p-4 text-white sm:p-6">
        <div>
          <h2 class="text-lg font-bold">Товары</h2>
          <p class="mt-1 text-sm text-slate-400">Найдите товар по названию или добавьте позицию вручную.</p>
        </div>

        <div class="relative">
          <input
            v-model="productSearch"
            class="w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-sky-500"
            placeholder="Поиск товара"
            @input="searchProducts($event.target.value)"
          />

          <div
            v-if="productSearchResults.length || isProductSearchLoading"
            class="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-auto rounded-xl border border-slate-700 bg-gray-950 shadow-2xl"
          >
            <div v-if="isProductSearchLoading" class="p-4 text-sm text-slate-400">Ищем товары...</div>
            <button
              v-for="product in productSearchResults"
              v-else
              :key="product.id"
              type="button"
              class="block w-full border-b border-slate-800 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-slate-800"
              @click="addProduct(product)"
            >
              <span class="block font-semibold">{{ product.name }}</span>
              <span class="mt-1 block text-xs text-slate-400">
                <template v-if="product.hasDiscount">
                  <span class="font-bold text-red-300">{{ formatPriceWithUsd(productUsdToTmt(product.price)) }}</span>
                  <span class="line-through">{{ formatPriceWithUsd(productUsdToTmt(product.originalPrice)) }}</span>
                  <span class="text-red-300">-{{ product.discountPercent }}%</span>
                  <span v-if="product.discountExpiresAt" class="block pt-1 text-red-200">
                    до {{ formatDiscountDate(product.discountExpiresAt) }}
                  </span>
                  ·
                </template>
                <template v-else>{{ formatPriceWithUsd(productUsdToTmt(product.price)) }} ·</template>
                остаток: {{ product.stock ?? 0 }}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          @click="addEmptyProduct"
        >
          Добавить вручную
        </button>

        <div class="space-y-3">
          <article
            v-for="(product, index) in form.products"
            :key="`${product._id}-${index}`"
            class="rounded-xl bg-gray-950 p-3 ring-1 ring-slate-800"
          >
            <div class="flex items-start justify-between gap-3">
              <input
                v-model="product.name"
                required
                class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                placeholder="Название товара"
              />
              <button
                type="button"
                class="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/25"
                @click="removeProduct(index)"
              >
                ×
              </button>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-xs text-slate-500">Кол.</span>
                <input
                  v-model.number="product.quantity"
                  required
                  min="1"
                  type="number"
                  class="mt-1 w-full rounded-lg border border-slate-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </label>

              <label class="block">
                <span class="text-xs text-slate-500">Цена</span>
                <input
                  v-model.number="product.price"
                  required
                  min="0"
                  type="number"
                  class="mt-1 w-full rounded-lg border border-slate-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </label>
            </div>

            <div
              v-if="product.hasDiscount"
              class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200 ring-1 ring-red-400/20"
            >
              Товар со скидкой -{{ product.discountPercent }}%:
              <span class="line-through">{{ formatPriceWithUsd(originalPrice(product)) }}</span>
              → <span class="font-bold">{{ formatPriceWithUsd(product.price) }}</span>
              <span v-if="product.discountExpiresAt" class="mt-1 block text-red-100">
                Скидка действует до {{ formatDiscountDate(product.discountExpiresAt) }}
              </span>
              <span v-if="product.quantity > 1">
                , экономия {{ formatPriceWithUsd(productDiscountTotal(product)) }}
              </span>
            </div>

            <p class="mt-3 text-right text-sm font-bold text-sky-300">
              {{ formatPriceWithUsd(product.price * product.quantity) }}
            </p>
          </article>
        </div>

        <div class="rounded-xl bg-slate-950 p-4 ring-1 ring-slate-800">
          <p class="text-xs uppercase tracking-wide text-slate-500">Итого</p>
          <div class="mt-3 space-y-2 text-sm">
            <div
              v-for="product in form.products"
              :key="`summary-${product._id}`"
              class="flex justify-between gap-3 text-slate-300"
            >
              <span>
                {{ product.name || 'Товар' }} × {{ product.quantity }}
                <span v-if="product.hasDiscount" class="text-red-300">
                  (-{{ product.discountPercent }}%)
                  <span v-if="product.discountExpiresAt" class="block text-[11px] text-red-200">
                    до {{ formatDiscountDate(product.discountExpiresAt) }}
                  </span>
                </span>
              </span>
              <span class="font-semibold">{{ formatPriceWithUsd(product.price * product.quantity) }}</span>
            </div>
            <div class="flex justify-between gap-3 border-t border-slate-800 pt-2">
              <span class="text-slate-500">Товары</span>
              <span>{{ formatPriceWithUsd(subtotalPrice) }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-slate-500">Доставка</span>
              <span>{{ deliveryPrice > 0 ? formatPriceWithUsd(deliveryPrice) : 'Бесплатно' }}</span>
            </div>
          </div>
          <p class="mt-3 border-t border-slate-800 pt-3 text-2xl font-black">
            {{ formatPriceWithUsd(totalPrice) }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="saving || loading"
          class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ saving ? 'Сохраняем...' : isEdit ? 'Сохранить заказ' : 'Создать заказ' }}
        </button>
      </aside>
    </form>

    <AppLoader v-if="loading">Загружаем заказ...</AppLoader>
  </section>
</template>
