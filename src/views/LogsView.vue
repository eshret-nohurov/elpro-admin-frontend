<script setup>
import AppEmpty from '@/components/AppEmpty.vue'
import AppLoader from '@/components/AppLoader.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useGlobalStore } from '@/stores/global'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const globalStore = useGlobalStore()

const loading = ref(false)
const logs = ref([])
const users = ref([])
const meta = ref(null)
const currentPage = ref(1)
const limit = ref(20)
const filters = ref({ user: '', entity: '', action: '' })

const entityOptions = [
  { value: '', label: 'Все разделы' },
  { value: 'order', label: 'Заказы' },
  { value: 'product', label: 'Товары' },
  { value: 'category', label: 'Категории' },
  { value: 'user', label: 'Пользователи' },
]

const actionOptions = [
  { value: '', label: 'Все действия' },
  { value: 'create', label: 'Создание' },
  { value: 'update', label: 'Редактирование' },
  { value: 'delete', label: 'Удаление' },
]

const actionLabels = {
  create: 'Создание',
  update: 'Редактирование',
  delete: 'Удаление',
}

const actionClasses = {
  create: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  update: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  delete: 'bg-red-500/15 text-red-300 ring-red-400/30',
}

const formatDate = (date) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))

const fetchLogs = async () => {
  try {
    loading.value = true
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.logs,
      params: {
        page: currentPage.value,
        limit: limit.value,
        user: filters.value.user || undefined,
        entity: filters.value.entity || undefined,
        action: filters.value.action || undefined,
      },
    })

    logs.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchLogs failed:', e)
    if (e.response?.status === 401 || e.response?.status === 403) {
      router.push('/dashboard')
    }
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.log_users,
    })
    users.value = response.data
  } catch (e) {
    console.error('fetchLogUsers failed:', e)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchLogs()
}

const nextPage = () => {
  if (meta.value?.hasNext) {
    currentPage.value++
    fetchLogs()
  }
}

const prevPage = () => {
  if (meta.value?.hasPrev) {
    currentPage.value--
    fetchLogs()
  }
}

const pageChange = (page) => {
  currentPage.value = page
  fetchLogs()
}

onMounted(() => {
  fetchUsers()
  fetchLogs()
})
</script>

<template>
  <section class="space-y-5 text-white">
    <div class="rounded-3xl border border-slate-800 bg-gray-900 p-4 sm:p-6">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-sky-400">Admin</p>
      <h1 class="mt-2 text-2xl font-black sm:text-3xl">Журнал действий</h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-400">
        Здесь фиксируются действия пользователей: создание, редактирование и удаление товаров, заказов и других сущностей.
      </p>
    </div>

    <div class="grid gap-3 rounded-2xl border border-slate-800 bg-gray-900 p-4 sm:grid-cols-3">
      <label class="block">
        <span class="text-xs uppercase tracking-wide text-slate-500">Пользователь</span>
        <select
          v-model="filters.user"
          class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-sky-500"
          @change="applyFilters"
        >
          <option value="">Все пользователи</option>
          <option v-for="user in users" :key="user._id" :value="user._id">
            {{ user.username }} · {{ user.role }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="text-xs uppercase tracking-wide text-slate-500">Раздел</span>
        <select
          v-model="filters.entity"
          class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-sky-500"
          @change="applyFilters"
        >
          <option v-for="entity in entityOptions" :key="entity.value" :value="entity.value">
            {{ entity.label }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="text-xs uppercase tracking-wide text-slate-500">Действие</span>
        <select
          v-model="filters.action"
          class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-sky-500"
          @change="applyFilters"
        >
          <option v-for="action in actionOptions" :key="action.value" :value="action.value">
            {{ action.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-800 bg-gray-900">
      <AppEmpty v-if="!loading && !logs.length" />

      <div v-else class="divide-y divide-slate-800">
        <article v-for="log in logs" :key="log._id" class="grid gap-4 p-4 lg:grid-cols-[220px_1fr_170px] lg:items-center">
          <div>
            <p class="font-bold">{{ log.username }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-slate-500">{{ log.role }}</p>
          </div>

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                :class="[
                  'rounded-full px-3 py-1 text-xs font-bold ring-1',
                  actionClasses[log.action] || 'bg-slate-500/15 text-slate-300 ring-slate-400/30',
                ]"
              >
                {{ actionLabels[log.action] || log.action }}
              </span>
              <span class="text-xs uppercase tracking-wide text-slate-500">{{ log.entity }}</span>
            </div>
            <p class="mt-3 break-words text-sm text-slate-100">{{ log.description }}</p>
            <p v-if="log.entityName" class="mt-1 text-xs text-slate-500">{{ log.entityName }}</p>
          </div>

          <p class="text-sm text-slate-400 lg:text-right">{{ formatDate(log.createdAt) }}</p>
        </article>
      </div>

      <div v-if="logs.length" class="border-t border-slate-800 p-4">
        <AppPagination
          :meta="meta"
          @prev-page="prevPage"
          @next-page="nextPage"
          @pageChange="pageChange"
        />
      </div>
    </div>

    <AppLoader v-if="loading">Загружаем журнал...</AppLoader>
  </section>
</template>
