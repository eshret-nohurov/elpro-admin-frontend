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
const slides = ref([])
const meta = ref(null)
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')

// GET DATA
const fetchSlides = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.main_banner_slides,
      params: {
        page: currentPage.value,
        limit: limit.value,
      },
    })

    slides.value = response.data
    meta.value = response.meta
  } catch (e) {
    console.error('fetchSlides failed:', e)
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
    fetchSlides()
  }
}

const prevPage = () => {
  if (meta.value?.hasPrev) {
    currentPage.value--
    fetchSlides()
  }
}

const pageChange = (page) => {
  currentPage.value = page
  fetchSlides()
}

// Подтверждение удаления
const handleConfirm = async () => {
  try {
    isModalOpen.value = false
    loading.value = true

    await globalStore.makeApiRequest({
      method: 'DELETE',
      url: globalStore.api.endpoints.delete_main_banner_slide(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.name}" успешно удалена!`)
    fetchSlides()
  } catch (e) {
    console.error('Delete main banner slide failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const deleteDataButt = (data) => {
  deleteData.value = data
  modalTitle.value = `Удалить слайд "${data.name}"?`
  isModalOpen.value = true
}

onMounted(fetchSlides)
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
    :listData="slides"
    :listVal="['name']"
    title="Слайды Главного Баннера"
    addButtName="Add Slide"
    addButtRoute="/main-page/main-banner/create"
    editButtRoute="/main-page/main-banner/edit"
    :meta="meta"
    @deleteData="deleteDataButt"
    @prevPage="prevPage"
    @nextPage="nextPage"
    @pageChange="pageChange"
  />

  <AppLoader v-if="loading"> Загружаем Слайды... </AppLoader>
</template>
