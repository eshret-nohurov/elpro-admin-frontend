<script setup>
import AppList from '@/components/AppList.vue'
import AppLoader from '@/components/AppLoader.vue'
import AppModal from '@/components/AppModal.vue'
import { useGlobalStore } from '@/stores/global'
import { onMounted, ref } from 'vue'
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
      },
    })

    categories.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchCategories failed:', e)
    if (e.response.status === 401) {
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
    if (e.response.status === 401) {
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
