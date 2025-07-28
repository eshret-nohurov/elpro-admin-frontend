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
const users = ref([])
const isModalOpen = ref(false)
const deleteData = ref({})
const modalTitle = ref('')

// GET DATA
const fetchUsers = async () => {
  try {
    loading.value = true

    const response = await globalStore.makeApiRequest({
      method: 'GET',
      url: globalStore.api.endpoints.users,
    })

    users.value = response.data
  } catch (e) {
    console.error('fetchUsers failed:', e)
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
      url: globalStore.api.endpoints.delete_user(deleteData.value._id),
    })

    toast.success(`"${deleteData.value.username}" успешно удалена!`)
    fetchUsers()
  } catch (e) {
    console.error('Delete user failed:', e)
    if (e.response.status === 401) {
      router.push('/auth/login')
    }
  } finally {
    loading.value = false
  }
}

const deleteDataButt = (data) => {
  deleteData.value = data
  modalTitle.value = `Удалить "${data.username}"?`
  isModalOpen.value = true
}

onMounted(fetchUsers)
</script>

<template>
  <AppModal
    v-model:isOpen="isModalOpen"
    @close="isModalOpen = false"
    @confirm="handleConfirm"
    :title="modalTitle"
  />

  <AppList
    :listHead="['#', 'Пользователь', 'Роль']"
    :listData="users"
    :listVal="['username', 'role']"
    title="Пользователи"
    addButtName="Add User"
    addButtRoute="/users/create"
    editButtRoute="/users/edit"
    @deleteData="deleteDataButt"
  />

  <AppLoader v-if="loading"> Загружаем Пользователей... </AppLoader>
</template>
