<script setup>
/*
 * Orders List
 * Показывает заказы, статусы, скидки, даты создания и редактирования с пагинацией.
 */
import AppEmpty from '@/components/AppEmpty.vue'
import AppLoader from '@/components/AppLoader.vue'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()
const globalStore = useGlobalStore()
const authStore = useAuthStore()

const loading = ref(false)
const updatingStatusId = ref(null)
const orders = ref([])
const meta = ref(null)
const currentPage = ref(1)
const limit = ref(15)
const statusFilter = ref('')
const expandedOrderId = ref(null)
const isDeleteModalOpen = ref(false)
const deleteData = ref(null)
const usdToTmtRate = ref(0)
const canDeleteOrders = computed(() => authStore.user?.username === 'eshret')

const statusOptions = [
  { value: '', label: 'Все заказы' },
  { value: 'pending', label: 'Новые' },
  { value: 'processing', label: 'В обработке' },
  { value: 'completed', label: 'Завершенные' },
  { value: 'cancelled', label: 'Отмененные' },
]

const orderStatuses = statusOptions.filter((status) => status.value)

const statusClasses = {
  pending: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  processing: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  cancelled: 'bg-red-500/15 text-red-300 ring-red-400/30',
}

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

const formatDate = (date) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ashgabat',
  }).format(new Date(date))

const wasEdited = (order) => {
  if (!order.updatedAt || !order.createdAt) return false

  const createdAt = new Date(order.createdAt).getTime()
  const updatedAt = new Date(order.updatedAt).getTime()
  return updatedAt - createdAt > 1000
}

const updatedAtLabel = (order) => (wasEdited(order) ? formatDate(order.updatedAt) : 'не редактировался')

const fetchSettings = async () => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.settings,
    })

    usdToTmtRate.value = Number(response.data?.[0]?.usdToTmtRate || 0)
  } catch (e) {
    console.error('fetchSettings failed:', e)
  }
}

const fetchOrders = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.orders,
      params: {
        page: currentPage.value,
        limit: limit.value,
        status: statusFilter.value || undefined,
      },
    })

    orders.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchOrders failed:', e)
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
    fetchOrders()
  }
}

const prevPage = () => {
  if (meta.value?.hasPrev) {
    currentPage.value--
    fetchOrders()
  }
}

const pageChange = (page) => {
  currentPage.value = page
  fetchOrders()
}

const changeStatusFilter = () => {
  currentPage.value = 1
  expandedOrderId.value = null
  fetchOrders()
}

const toggleOrder = (orderId) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

const updateStatus = async (order, status) => {
  if (order.status === status) return

  try {
    updatingStatusId.value = order._id

    const response = await globalStore.makeApiRequest({
      method: 'PATCH',
      url: globalStore.api.endpoints.update_order_status(order._id),
      data: { status },
    })

    const index = orders.value.findIndex((item) => item._id === order._id)
    if (index !== -1) {
      orders.value[index] = response.data
    }

    toast.success('Статус заказа обновлен')
  } catch (e) {
    console.error('updateOrderStatus failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    updatingStatusId.value = null
  }
}

const openDeleteModal = (order) => {
  deleteData.value = order
  isDeleteModalOpen.value = true
}

const deleteOrder = async () => {
  if (!deleteData.value) return

  try {
    loading.value = true
    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_order(deleteData.value._id),
    })

    toast.success('Заказ удален')
    isDeleteModalOpen.value = false
    deleteData.value = null
    expandedOrderId.value = null
    fetchOrders()
  } catch (e) {
    console.error('deleteOrder failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
  fetchOrders()
})
</script>

<template>
  <section class="space-y-5">
    <AppModal
      v-model:isOpen="isDeleteModalOpen"
      :title="deleteData ? `Удалить заказ ${deleteData.name}?` : 'Удалить заказ?'"
      @close="isDeleteModalOpen = false"
      @confirm="deleteOrder"
    />

    <div class="rounded-2xl border border-slate-800 bg-gray-900 p-4 text-white sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-sky-400">Заказы</p>
          <h1 class="mt-2 text-2xl font-bold sm:text-3xl">Список заказов</h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-400">
            Все новые заказы с сайта попадают сюда. Откройте заказ, проверьте товары и свяжитесь с клиентом.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
          <RouterLink
            to="/orders/create"
            class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 sm:col-span-2"
          >
            Создать заказ
          </RouterLink>

          <label class="block rounded-xl bg-gray-950 p-4 ring-1 ring-slate-800 sm:col-span-2">
            <span class="text-xs uppercase tracking-wide text-slate-500">Фильтр</span>
            <select
              v-model="statusFilter"
              class="mt-2 w-full rounded-lg border border-slate-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
              @change="changeStatusFilter"
            >
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-800 bg-gray-900 text-white">
      <AppEmpty v-if="!loading && !orders.length" />

      <div v-else class="divide-y divide-slate-800">
        <article v-for="order in orders" :key="order._id" class="p-4 sm:p-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button class="min-w-0 text-left" type="button" @click="toggleOrder(order._id)">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-mono text-sm text-slate-400">#{{ order._id.slice(-6).toUpperCase() }}</span>
                <span
                  class="rounded-full px-3 py-1 text-xs font-bold ring-1"
                  :class="statusClasses[order.status]"
                >
                  {{ order.statusLabel }}
                </span>
                <span class="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  создан {{ formatDate(order.createdAt) }}
                </span>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="wasEdited(order) ? 'bg-amber-500/10 text-amber-200' : 'bg-slate-800 text-slate-500'"
                >
                  изменен {{ updatedAtLabel(order) }}
                </span>
              </div>

              <h2 class="mt-3 text-lg font-bold text-white">{{ order.name }}</h2>
              <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
                <span>{{ order.phone }}</span>
                <span v-if="order.email">{{ order.email }}</span>
                <span>{{ order.deliveryType }}</span>
                <span>{{ order.productsCount }} шт.</span>
              </div>
            </button>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
              <div class="rounded-xl bg-gray-950 px-4 py-3 text-left sm:text-right">
                <p class="text-xs uppercase tracking-wide text-slate-500">Сумма</p>
                <p class="text-xl font-black text-white">{{ formatPriceWithUsd(order.totalPrice) }}</p>
                <p v-if="order.deliveryPrice" class="mt-1 text-xs text-slate-500">
                  доставка {{ formatPriceWithUsd(order.deliveryPrice) }}
                </p>
              </div>

              <select
                class="rounded-xl border border-slate-700 bg-gray-950 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-sky-500 disabled:opacity-60"
                :value="order.status"
                :disabled="updatingStatusId === order._id"
                @change="updateStatus(order, $event.target.value)"
              >
                <option v-for="status in orderStatuses" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>

              <button
                type="button"
                class="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                @click="toggleOrder(order._id)"
              >
                {{ expandedOrderId === order._id ? 'Скрыть' : 'Подробнее' }}
              </button>

              <RouterLink
                :to="`/orders/edit/${order._id}`"
                class="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Редактировать
              </RouterLink>

              <button
                v-if="canDeleteOrders"
                type="button"
                class="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                @click="openDeleteModal(order)"
              >
                Удалить
              </button>
            </div>
          </div>

          <div v-if="expandedOrderId === order._id" class="mt-5 grid gap-4 xl:grid-cols-[1fr_1.3fr]">
            <div class="space-y-3 rounded-2xl bg-gray-950 p-4 ring-1 ring-slate-800">
              <h3 class="font-bold">Данные клиента</h3>
              <dl class="space-y-3 text-sm">
                <div class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Имя</dt>
                  <dd>{{ order.name }}</dd>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Телефон</dt>
                  <dd>{{ order.phone }}</dd>
                </div>
                <div v-if="order.email" class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Email</dt>
                  <dd>{{ order.email }}</dd>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Город</dt>
                  <dd>{{ order.location }}</dd>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Получение</dt>
                  <dd>{{ order.deliveryType }}</dd>
                </div>
                <div v-if="!order.isPickup" class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Адрес</dt>
                  <dd>{{ order.address }}</dd>
                </div>
                <div v-if="order.comment" class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Комментарий</dt>
                  <dd class="whitespace-pre-line">{{ order.comment }}</dd>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Создан</dt>
                  <dd>{{ formatDate(order.createdAt) }}</dd>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-3">
                  <dt class="text-slate-500">Изменен</dt>
                  <dd>{{ updatedAtLabel(order) }}</dd>
                </div>
              </dl>
            </div>

            <div class="overflow-hidden rounded-2xl bg-gray-950 ring-1 ring-slate-800">
              <div class="border-b border-slate-800 p-4">
                <h3 class="font-bold">Товары в заказе</h3>
              </div>

              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3">Товар</th>
                      <th class="px-4 py-3 text-center">Кол.</th>
                      <th class="px-4 py-3 text-right">Цена</th>
                      <th class="px-4 py-3 text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800">
                    <tr v-for="product in order.products" :key="product._id">
                      <td class="px-4 py-4">
                        <div class="font-semibold">{{ product.name }}</div>
                        <div class="mt-1 font-mono text-xs text-slate-500">{{ product._id }}</div>
                        <div
                          v-if="product.hasDiscount"
                          class="mt-2 inline-flex rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-300 ring-1 ring-red-400/20"
                        >
                          Скидка -{{ product.discountPercent }}%
                        </div>
                        <div
                          v-if="product.hasDiscount && product.discountExpiresAt"
                          class="mt-2 inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-400/20"
                        >
                          до {{ formatDiscountDate(product.discountExpiresAt) }}
                        </div>
                        <div
                          v-if="product.hasDiscount"
                          class="mt-2 text-xs text-slate-400"
                        >
                          заказ создан: {{ formatDate(order.createdAt) }}
                        </div>
                      </td>
                      <td class="px-4 py-4 text-center">{{ product.quantity }}</td>
                      <td class="px-4 py-4 text-right">
                        <div>{{ formatPriceWithUsd(product.price) }}</div>
                        <div v-if="product.hasDiscount" class="text-xs text-slate-500 line-through">
                          {{ formatPriceWithUsd(originalPrice(product)) }}
                        </div>
                      </td>
                      <td class="px-4 py-4 text-right font-bold">
                        {{ formatPriceWithUsd(product.price * product.quantity) }}
                        <div v-if="product.hasDiscount" class="mt-1 text-xs font-medium text-red-300">
                          экономия {{ formatPriceWithUsd(productDiscountTotal(product)) }}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="space-y-2 border-t border-slate-800 p-4 text-sm">
                <div class="flex justify-between gap-3 text-slate-400">
                  <span>Товары</span>
                  <span class="font-semibold text-white">{{ formatPriceWithUsd(order.subtotalPrice) }}</span>
                </div>
                <div class="flex justify-between gap-3 text-slate-400">
                  <span>Доставка</span>
                  <span class="font-semibold text-white">
                    {{ order.deliveryPrice > 0 ? formatPriceWithUsd(order.deliveryPrice) : 'Бесплатно' }}
                  </span>
                </div>
                <div class="flex justify-between gap-3 border-t border-slate-800 pt-2 text-base font-bold text-white">
                  <span>Итого</span>
                  <span>{{ formatPriceWithUsd(order.totalPrice) }}</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-if="orders.length" class="border-t border-slate-800 p-4">
        <AppPagination
          :meta="meta"
          @prev-page="prevPage"
          @next-page="nextPage"
          @pageChange="pageChange"
        />
      </div>
    </div>

    <AppLoader v-if="loading">Загружаем заказы...</AppLoader>
  </section>
</template>
