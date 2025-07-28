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
const sections = ref([])
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')

// GET DATA
const fetchSections = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.products_section,
    })

    sections.value = response.data
  } catch (e) {
    console.error('fetchSections failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

// Подтверждение удаления
const handleConfirm = async () => {
  try {
    isModalOpen.value = false
    loading.value = true

    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_products_section(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.name}" успешно удалена!`)
    fetchSections()
  } catch (e) {
    console.error('Delete products_section failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const deleteDataButt = (data) => {
  deleteData.value = data
  modalTitle.value = `Удалить "${data.name}"?`
  isModalOpen.value = true
}

onMounted(fetchSections)
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
    :listData="sections"
    :listVal="['name']"
    title="Секции товаров"
    addButtName="Add Section"
    addButtRoute="/main-page/products-section/create"
    editButtRoute="/main-page/products-section/edit"
    :lengthLimit="sections.length >= 4 ? true : false"
    addButtLimitTXT="Предел в 4 блока"
    @deleteData="deleteDataButt"
  />

  <AppLoader v-if="loading"> Загружаем Секций... </AppLoader>
</template>
