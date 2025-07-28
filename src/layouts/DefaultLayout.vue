<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <div class="h-full">
    <AppSidebar />

    <div class="flex flex-col pl-[var(--container-3xs)] h-full">
      <AppBreadcrumb />
      <div class="bg-gray-950 p-5 overflow-y-auto h-full">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
