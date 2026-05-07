<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { ref } from 'vue'

const isSidebarOpen = ref(false)
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
      <div class="flex-1 overflow-y-auto bg-gray-950 p-3 sm:p-4 lg:p-5">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
