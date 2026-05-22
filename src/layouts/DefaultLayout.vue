<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useGlobalStore } from '@/stores/global'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const isSidebarOpen = ref(false)
const route = useRoute()
const router = useRouter()
const globalStore = useGlobalStore()

const pendingOrdersCount = ref(0)
const pendingOrdersLoading = ref(false)
const isPendingOrdersModalOpen = ref(false)
const pendingOrdersReminderKey = 'elpro_pending_orders_reminder_until'
let pendingOrdersInterval = null

const isFormRoute = computed(() => /\/(create|edit)(\/|$)/.test(route.path))
const isOrdersRoute = computed(() => route.path.startsWith('/orders'))
const hasPendingOrders = computed(() => pendingOrdersCount.value > 0)
const shouldShowPendingOrdersAlert = computed(() => hasPendingOrders.value && !isFormRoute.value)

const getReminderUntil = () => Number(sessionStorage.getItem(pendingOrdersReminderKey) || 0)

const canOpenPendingOrdersModal = () =>
  shouldShowPendingOrdersAlert.value && !isOrdersRoute.value && Date.now() > getReminderUntil()

const openPendingOrdersModalIfNeeded = () => {
  if (canOpenPendingOrdersModal()) {
    isPendingOrdersModalOpen.value = true
  } else if (!shouldShowPendingOrdersAlert.value) {
    isPendingOrdersModalOpen.value = false
  }
}

const fetchPendingOrdersCount = async () => {
  if (isFormRoute.value) {
    isPendingOrdersModalOpen.value = false
    return
  }

  try {
    pendingOrdersLoading.value = true
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.orders,
      params: {
        status: 'pending',
        page: 1,
        limit: 1,
      },
    })

    pendingOrdersCount.value = Number(response.meta?.total || 0)
    openPendingOrdersModalIfNeeded()
  } catch (error) {
    console.error('fetchPendingOrdersCount failed:', error)
  } finally {
    pendingOrdersLoading.value = false
  }
}

const remindPendingOrdersLater = () => {
  sessionStorage.setItem(pendingOrdersReminderKey, String(Date.now() + 5 * 60 * 1000))
  isPendingOrdersModalOpen.value = false
}

const goToPendingOrders = () => {
  isPendingOrdersModalOpen.value = false
  router.push({ path: '/orders', query: { status: 'pending' } })
}

onMounted(() => {
  fetchPendingOrdersCount()
  pendingOrdersInterval = window.setInterval(fetchPendingOrdersCount, 45000)
})

onBeforeUnmount(() => {
  if (pendingOrdersInterval) {
    window.clearInterval(pendingOrdersInterval)
  }
})

watch(
  () => route.fullPath,
  () => {
    fetchPendingOrdersCount()
  },
)
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <AppSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" @navigate="isSidebarOpen = false" />

    <div class="flex min-h-screen flex-col lg:pl-72">
      <header
        class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-gray-900/95 px-4 py-3 backdrop-blur lg:hidden"
      >
        <img src="@/assets/img/logo/logo-white.png" alt="Elpro" class="h-9 w-auto" />

        <button
          class="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
          type="button"
          @click="isSidebarOpen = true"
        >
          <span class="sr-only">Открыть меню</span>
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Меню
        </button>
      </header>

      <AppBreadcrumb />
      <div
        v-if="shouldShowPendingOrdersAlert"
        class="sticky top-0 z-40 border-b border-red-400/40 bg-red-600 px-4 py-3 text-white shadow-2xl shadow-red-950/40 lg:top-0"
      >
        <div class="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.18em]">
              Срочно: есть необработанные заказы
            </p>
            <p class="mt-1 text-sm text-red-50">
              Новых заказов: <span class="font-black">{{ pendingOrdersCount }}</span>.
              Их нужно открыть, проверить и перевести в обработку.
            </p>
          </div>

          <button
            type="button"
            class="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-50"
            @click="goToPendingOrders"
          >
            Обработать сейчас
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto bg-gray-950 p-3 sm:p-4 lg:p-5">
        <router-view></router-view>
      </div>
    </div>

    <div
      v-if="isPendingOrdersModalOpen && shouldShowPendingOrdersAlert"
      class="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-xl overflow-hidden rounded-3xl border border-red-400/50 bg-gray-950 text-white shadow-2xl shadow-red-950/50">
        <div class="bg-red-600 px-6 py-5">
          <p class="text-sm font-black uppercase tracking-[0.22em] text-red-100">
            Требуется внимание
          </p>
          <h2 class="mt-2 text-2xl font-black sm:text-3xl">
            Есть новые заказы
          </h2>
        </div>

        <div class="space-y-5 p-6">
          <p class="text-base leading-7 text-slate-200">
            Сейчас в админке есть
            <span class="font-black text-red-300">{{ pendingOrdersCount }}</span>
            необработанных заказов. Их нельзя оставлять без внимания: клиент ждет подтверждения.
          </p>

          <div class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            Перейдите в заказы, откройте новые заявки и переведите их в статус
            <span class="font-bold">«В обработке»</span>, когда начнете работать.
          </div>

          <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              class="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
              @click="goToPendingOrders"
            >
              Перейти и обработать
            </button>

            <button
              type="button"
              class="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              @click="remindPendingOrdersLater"
            >
              Напомнить через 5 минут
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
