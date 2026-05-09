<script setup>
/*
 * Dashboard Metrics
 * Показывает сводку по заказам, товарам и доступным показателям с учетом роли пользователя.
 */
import AppLoader from '@/components/AppLoader.vue'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStore } from '@/stores/global'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const globalStore = useGlobalStore()

const loading = ref(false)
const dashboard = ref({
  canViewFinancials: false,
  cards: {},
  ordersByStatus: [],
  recentOrders: [],
})

const statusClasses = {
  pending: 'bg-sky-500',
  processing: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const maxStatusCount = computed(() =>
  Math.max(...dashboard.value.ordersByStatus.map((status) => status.count), 1),
)

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU')
const formatPrice = (value) => `${formatNumber(value)} тмт`
const formatDate = (date) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
const canViewFinancials = computed(
  () => dashboard.value.canViewFinancials && authStore.user?.role === 'admin',
)

const mainCards = computed(() => {
  const cards = [
    {
      title: 'Всего заказов',
      value: formatNumber(dashboard.value.cards.ordersTotal),
      note: `${formatNumber(dashboard.value.cards.activeOrdersTotal)} активных`,
      accent: 'from-sky-500 to-cyan-400',
    },
    {
      title: 'Товаров в заказах',
      value: formatNumber(dashboard.value.cards.orderedProductsTotal),
      note: 'Штук заказано клиентами',
      accent: 'from-violet-500 to-fuchsia-400',
    },
    {
      title: 'Товаров в каталоге',
      value: formatNumber(dashboard.value.cards.productsTotal),
      note: `${formatNumber(dashboard.value.cards.totalStock)} шт. на складе`,
      accent: 'from-orange-500 to-amber-300',
    },
  ]

  if (canViewFinancials.value) {
    cards.splice(1, 0, {
      title: 'Сумма заказов',
      value: formatPrice(dashboard.value.cards.revenueTotal),
      note: 'Без отмененных заказов',
      accent: 'from-emerald-500 to-lime-400',
    })
  }

  return cards
})

const stockCards = computed(() => [
  {
    title: 'Заканчиваются',
    value: formatNumber(dashboard.value.cards.lowStock),
    note: 'Остаток от 1 до 5 шт.',
    class: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  },
  {
    title: 'Нет в наличии',
    value: formatNumber(dashboard.value.cards.outOfStock),
    note: 'Нужно проверить склад',
    class: 'border-red-500/30 bg-red-500/10 text-red-200',
  },
])

const fetchDashboard = async () => {
  try {
    loading.value = true
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.dashboard,
    })

    dashboard.value = response.data
  } catch (e) {
    console.error('fetchDashboard failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="overflow-hidden rounded-3xl border border-slate-800 bg-gray-900">
      <div class="relative p-5 sm:p-7">
        <div class="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl"></div>
        <div class="absolute bottom-0 right-20 h-28 w-28 rounded-full bg-indigo-500/20 blur-3xl"></div>

        <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-400">Dashboard</p>
            <h1 class="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Пульс ELPRO</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Быстрый обзор заказов и состояния каталога. Чтобы сразу было понятно, где нужно внимание.
            </p>
          </div>

          <RouterLink
            to="/orders/create"
            class="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Создать заказ
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in mainCards"
        :key="card.title"
        class="relative overflow-hidden rounded-2xl border border-slate-800 bg-gray-900 p-5"
      >
        <div :class="['absolute inset-x-0 top-0 h-1 bg-gradient-to-r', card.accent]"></div>
        <p class="text-sm text-slate-400">{{ card.title }}</p>
        <p class="mt-3 text-3xl font-black">{{ card.value }}</p>
        <p class="mt-2 text-sm text-slate-500">{{ card.note }}</p>
      </article>
    </div>

    <div class="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="rounded-3xl border border-slate-800 bg-gray-900 p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold">Заказы по статусам</h2>
            <p class="mt-1 text-sm text-slate-500">Наглядно видно, что сейчас требует обработки.</p>
          </div>
          <RouterLink to="/orders" class="text-sm font-bold text-sky-400 hover:text-sky-300">
            Все заказы
          </RouterLink>
        </div>

        <div class="mt-6 space-y-5">
          <div v-for="status in dashboard.ordersByStatus" :key="status.status">
            <div class="mb-2 flex items-center justify-between gap-3 text-sm">
              <span class="font-semibold">{{ status.label }}</span>
              <span class="text-slate-400">
                {{ status.count }} заказов
                <template v-if="canViewFinancials"> · {{ formatPrice(status.totalPrice) }}</template>
              </span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                :class="['h-full rounded-full', statusClasses[status.status]]"
                :style="{ width: `${Math.max((status.count / maxStatusCount) * 100, status.count ? 8 : 0)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <article
          v-for="card in stockCards"
          :key="card.title"
          :class="['rounded-3xl border p-5 sm:p-6', card.class]"
        >
          <p class="text-sm opacity-80">{{ card.title }}</p>
          <p class="mt-2 text-4xl font-black">{{ card.value }}</p>
          <p class="mt-2 text-sm opacity-80">{{ card.note }}</p>
        </article>
      </section>
    </div>

    <section class="rounded-3xl border border-slate-800 bg-gray-900 p-5 sm:p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold">Последние заказы</h2>
          <p class="mt-1 text-sm text-slate-500">Свежие поступления, чтобы ничего не потерялось.</p>
        </div>
        <RouterLink to="/orders" class="text-sm font-bold text-sky-400 hover:text-sky-300">
          Открыть
        </RouterLink>
      </div>

      <div v-if="dashboard.recentOrders.length" class="mt-5 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="py-3 pr-4">Клиент</th>
              <th class="px-4 py-3">Статус</th>
              <th class="px-4 py-3">Товары</th>
              <th v-if="canViewFinancials" class="px-4 py-3 text-right">Сумма</th>
              <th class="py-3 pl-4 text-right">Дата</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="order in dashboard.recentOrders" :key="order._id">
              <td class="py-4 pr-4">
                <RouterLink :to="`/orders/edit/${order._id}`" class="font-bold hover:text-sky-300">
                  {{ order.name }}
                </RouterLink>
                <p class="mt-1 text-xs text-slate-500">{{ order.phone }}</p>
              </td>
              <td class="px-4 py-4">{{ order.statusLabel }}</td>
              <td class="px-4 py-4">{{ order.productsCount }} шт.</td>
              <td v-if="canViewFinancials" class="px-4 py-4 text-right font-bold">
                {{ formatPrice(order.totalPrice) }}
              </td>
              <td class="py-4 pl-4 text-right text-slate-400">{{ formatDate(order.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="mt-5 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
        Заказов пока нет.
      </div>
    </section>

    <AppLoader v-if="loading">Загружаем показатели...</AppLoader>
  </section>
</template>
