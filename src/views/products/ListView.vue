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
const products = ref([])
const meta = ref(null)
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')

// GET DATA
const fetchData = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.products,
      params: {
        page: currentPage.value,
        limit: limit.value,
      },
    })

    products.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchProducts failed:', e)
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

// Подтверждение удаления
const handleConfirm = async () => {
  try {
    isModalOpen.value = false
    loading.value = true

    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_product(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.name}" успешно удалена!`)
    fetchData()
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
  modalTitle.value = `Удалить продукт "${data.name}"?`
  isModalOpen.value = true
}

onMounted(fetchData)
</script>

<template>
  <AppModal
    v-model:isOpen="isModalOpen"
    @close="isModalOpen = false"
    @confirm="handleConfirm"
    :title="modalTitle"
  />

  <AppList
    :listHead="['#', 'Название']"
    :listData="products"
    :listVal="['name']"
    title="Продукты"
    addButtName="Add Product"
    addButtRoute="/products/create"
    editButtRoute="/products/edit"
    :meta="meta"
    @deleteData="deleteDataButt"
    @prevPage="prevPage"
    @nextPage="nextPage"
    @pageChange="pageChange"
  />

  <AppLoader v-if="loading"> Загружаем продукты... </AppLoader>
</template>
