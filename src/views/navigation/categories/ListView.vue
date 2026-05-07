<script setup>
import AppList from '@/components/AppList.vue'
import AppLoader from '@/components/AppLoader.vue'
import AppModal from '@/components/AppModal.vue'
import { useGlobalStore } from '@/stores/global'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const globalStore = useGlobalStore()

// var
const loading = ref(false)
const currentPage = ref(1)
const limit = ref(15)
const categories = ref([])
const meta = ref(null)
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')
const search = ref('')
let searchTimer = null

const hasSearch = computed(() => Boolean(search.value.trim()))

// GET DATA
const fetchCategories = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.categories,
      params: {
        page: currentPage.value,
        limit: limit.value,
        search: search.value.trim() || undefined,
      },
    })

    categories.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchCategories failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

// Навигация по страницам
const nextPage = () => {
  if (meta.value?.hasNext) {
    currentPage.value++
    fetchCategories()
  }
}

const prevPage = () => {
  if (meta.value?.hasPrev) {
    currentPage.value--
    fetchCategories()
  }
}

const pageChange = (page) => {
  currentPage.value = page
  fetchCategories()
}

const applySearch = () => {
  currentPage.value = 1
  fetchCategories()
}

const handleSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(applySearch, 350)
}

const resetSearch = () => {
  search.value = ''
  applySearch()
}

// Подтверждение удаления
const handleConfirm = async () => {
  try {
    isModalOpen.value = false
    loading.value = true

    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_category(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.name}" успешно удалена!`)
    fetchCategories()
  } catch (e) {
    console.error('Delete category failed:', e)
    if (e.response?.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const deleteDataButt = (data) => {
  deleteData.value = data
  modalTitle.value = `Удалить категорию "${data.name}"?`
  isModalOpen.value = true
}

onMounted(fetchCategories)
</script>

<template>
  <AppModal
    v-model:isOpen="isModalOpen"
    @close="isModalOpen = false"
    @confirm="handleConfirm"
    :title="modalTitle"
  />

  <div class="mb-4 rounded-2xl border border-slate-800 bg-gray-900 p-4 text-white">
    <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
      <label class="block">
        <span class="text-xs uppercase tracking-wide text-slate-500">Поиск категорий</span>
        <input
          v-model="search"
          class="mt-2 w-full rounded-xl border border-slate-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
          placeholder="Название или URL категории"
          @input="handleSearchInput"
        />
      </label>
      <button
        v-if="hasSearch"
        type="button"
        class="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
        @click="resetSearch"
      >
        Сбросить
      </button>
    </div>
  </div>

  <AppList
    :listHead="['#', 'Название', 'url']"
    :listData="categories"
    :listVal="['name', 'url']"
    title="Категории"
    addButtName="Add Category"
    addButtRoute="/navigation/categories/create"
    editButtRoute="/navigation/categories/edit"
    :meta="meta"
    @deleteData="deleteDataButt"
    @prevPage="prevPage"
    @nextPage="nextPage"
    @pageChange="pageChange"
  />

  <AppLoader v-if="loading"> Загружаем категории... </AppLoader>
</template>
