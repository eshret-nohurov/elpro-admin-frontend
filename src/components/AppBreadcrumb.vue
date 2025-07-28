<script setup>
import router from '@/router'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const breadcrumbs = ref()

const getBreadcrumbs = () => {
  return router.currentRoute.value.matched.map((route) => {
    return {
      active: route.path === router.currentRoute.value.fullPath,
      name: route.name,
      path: `${router.options.history.base}${route.path}`,
    }
  })
}

router.afterEach(() => {
  breadcrumbs.value = getBreadcrumbs()
})

onMounted(() => {
  breadcrumbs.value = getBreadcrumbs()
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="px-4 py-5 static border-b border-slate-800 w-full">
    <ol class="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
      <li v-for="(item, index) in breadcrumbs" :key="index" class="flex items-center">
        <RouterLink :to="item.path" v-if="item.name === 'Home'">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </RouterLink>

        <RouterLink :to="item.path" v-else>
          {{ item.name }}
        </RouterLink>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
          v-if="index < breadcrumbs.length - 1"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m9 20.247 6-16.5" />
        </svg>
      </li>
    </ol>
  </nav>
</template>
