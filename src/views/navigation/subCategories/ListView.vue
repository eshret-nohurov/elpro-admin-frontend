<script setup>
/*
 * Subcategories List
 * Показывает подкатегории с пагинацией и быстрыми действиями управления.
 */
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


const loading = ref(false)
const currentPage = ref(1)
const limit = ref(15)
const subcategories = ref([])
const meta = ref(null)
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')


const fetchSubCategories = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.subcategories,
      params: {
        page: currentPage.value,
        limit: limit.value,
      },
    })

    subcategories.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchSubCategories failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}


const nextPage = () => {
  if (meta.value?.hasNext) {
    currentPage.value++
    fetchSubCategories()
  }
}

const prevPage = () => {
  if (meta.value?.hasPrev) {
    currentPage.value--
    fetchSubCategories()
  }
}

const pageChange = (page) => {
  currentPage.value = page
  fetchSubCategories()
}


const handleConfirm = async () => {
  try {
    isModalOpen.value = false
    loading.value = true

    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_subcategory(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.name}" успешно удалена!`)
    fetchSubCategories()
  } catch (e) {
    console.error('Delete subcategory failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const deleteDataButt = (data) => {
  deleteData.value = data
  modalTitle.value = `Удалить подкатегорию "${data.name}"?`
  isModalOpen.value = true
}

onMounted(fetchSubCategories)
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
    :listData="subcategories"
    :listVal="['name', 'url']"
    title="Подкатегории"
    addButtName="Add SubCategory"
    addButtRoute="/navigation/subcategories/create"
    editButtRoute="/navigation/subcategories/edit"
    :meta="meta"
    @deleteData="deleteDataButt"
    @prevPage="prevPage"
    @nextPage="nextPage"
    @pageChange="pageChange"
  />

  <AppLoader v-if="loading"> Загружаем подкатегории... </AppLoader>
</template>
