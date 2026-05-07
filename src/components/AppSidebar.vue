<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'navigate'])

const handleSidebarClick = event => {
  if (event.target.closest('a')) {
    emit('navigate')
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    emit('navigate')
    router.push('/auth/login')
    toast.success('Вы успешно вышли из системы!')
  } catch (error) {
    console.error('Logout failed:', error)
    toast.error('Ошибка при выходе из системы. Пожалуйста, попробуйте еще раз.')
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden"
    :class="isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
    @click="emit('close')"
  ></div>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[86vw] flex-col justify-between overflow-auto border-e border-slate-800 bg-gray-900 shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    @click="handleSidebarClick"
  >
    <div class="px-4 py-6">
      <div class="flex items-center justify-between gap-3 mt-2">
        <img src="@/assets/img/logo/logo-white.png" alt="Logo" class="h-20" />
        <button
          class="rounded-lg bg-slate-800 p-2 text-white lg:hidden"
          type="button"
          @click="emit('close')"
        >
          <span class="sr-only">Закрыть меню</span>
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul class="mt-10 space-y-1">
        <!-- Dashboard -->
        <li>
          <RouterLink
            to="/dashboard"
            active-class="bg-slate-800"
            class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-100 hover:bg-slate-800"
          >
            Dashboard
          </RouterLink>
        </li>

        <!-- Заказы -->
        <li>
          <RouterLink
            to="/orders"
            active-class="bg-slate-800"
            class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-100 hover:bg-slate-800"
          >
            Заказы
          </RouterLink>
        </li>

        <!-- Категории -->
        <li
          :class="{
            'bg-slate-800': $route.path.startsWith('/navigation/categories'),
            'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
          }"
        >
          <RouterLink class="block w-full h-full px-4 py-2 text-sm font-medium" to="/navigation/categories">
            Категории
          </RouterLink>
        </li>

        <!-- Главная страница -->
        <li>
          <details class="group [&_summary::-webkit-details-marker]:hidden">
            <summary
              :class="{
                'bg-slate-800': $route.path.startsWith('/main-page'),
                'flex cursor-pointer items-center justify-between rounded-lg px-4 py-2 text-gray-100 hover:bg-slate-800': true,
              }"
            >
              <span class="text-sm font-medium"> Главная страница </span>

              <span class="shrink-0 transition duration-300 group-open:-rotate-180">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="size-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            </summary>

            <ul class="mt-2 space-y-1 px-4">
              <!-- Главный баннер -->
              <li
                :class="{
                  'bg-slate-800': $route.path.startsWith('/main-page/main-banner'),
                  'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
                }"
              >
                <RouterLink class="block w-full h-full px-4 py-2" to="/main-page/main-banner">
                  Главный баннер
                </RouterLink>
              </li>

              <!-- Promo баннер -->
              <li
                :class="{
                  'bg-slate-800': $route.path.startsWith('/main-page/promo-banner'),
                  'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
                }"
              >
                <RouterLink class="block w-full h-full px-4 py-2" to="/main-page/promo-banner">
                  Промо баннер
                </RouterLink>
              </li>

              <!-- Секция товаров -->
              <li
                :class="{
                  'bg-slate-800': $route.path.startsWith('/main-page/products-section'),
                  'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
                }"
              >
                <RouterLink class="block w-full h-full px-4 py-2" to="/main-page/products-section">
                  Секция товаров
                </RouterLink>
              </li>

              <!-- Footer баннер -->
              <li
                :class="{
                  'bg-slate-800': $route.path.startsWith('/main-page/footer-banner'),
                  'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
                }"
              >
                <RouterLink class="block w-full h-full px-4 py-2" to="/main-page/footer-banner">
                  Футер баннер
                </RouterLink>
              </li>
            </ul>
          </details>
        </li>

        <li
          :class="{
            'bg-slate-800': $route.path.startsWith('/products'),
            'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
          }"
        >
          <RouterLink class="block w-full h-full px-4 py-2" to="/products/list">
            Products
          </RouterLink>
        </li>

        <li
          v-if="authStore.user && authStore.user.role == 'admin'"
          :class="{
            'bg-slate-800': $route.path.startsWith('/users'),
            'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
          }"
        >
          <RouterLink class="block w-full h-full px-4 py-2" to="/users/list"> Users </RouterLink>
        </li>

        <li
          v-if="authStore.user && authStore.user.role == 'admin'"
          :class="{
            'bg-slate-800': $route.path.startsWith('/settings'),
            'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
          }"
        >
          <RouterLink class="block w-full h-full px-4 py-2" to="/settings"> Settings </RouterLink>
        </li>

        <li
          v-if="authStore.user && authStore.user.role == 'admin'"
          :class="{
            'bg-slate-800': $route.path.startsWith('/logs'),
            'flex cursor-pointer items-center justify-between rounded-lg text-gray-100 hover:bg-slate-800': true,
          }"
        >
          <RouterLink class="block w-full h-full px-4 py-2" to="/logs"> Логи </RouterLink>
        </li>
      </ul>
    </div>

    <div
      class="sticky inset-x-0 bottom-0 border-t border-slate-800 h-18 flex items-center bg-gray-900 py-4"
    >
      <div class="flex w-full justify-between items-center px-5">
        <div class="flex items-center gap-2">
          <img alt="" src="@/assets/img/ico/ava.svg" class="size-8 rounded-full object-cover" />

          <div>
            <p class="text-xs text-gray-100">
              <span class="block font-medium">{{ authStore.user.username }}</span>
            </p>
          </div>
        </div>

        <button @click="handleLogout" class="cursor-pointer">
          <img src="@/assets/img/ico/exit.png" class="w-5" alt="" />
        </button>
      </div>
    </div>
  </aside>
</template>
