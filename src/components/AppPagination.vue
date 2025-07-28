<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    }),
    validator: (value) => {
      // Проверяем, что meta не null и содержит необходимые свойства
      return (
        value === null ||
        (typeof value === 'object' &&
          'page' in value &&
          'totalPages' in value &&
          'hasPrev' in value &&
          'hasNext' in value)
      )
    },
  },
})

const emit = defineEmits(['prevPage', 'nextPage', 'pageChange'])

// Используем безопасное обращение к свойствам meta
const safeMeta = computed(() => ({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false,
  ...props.meta,
}))

// Генерация диапазона страниц
const pagesRange = computed(() => {
  const current = safeMeta.value.page
  const total = safeMeta.value.totalPages
  const delta = 2
  const range = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) range.unshift('...')
  if (current + delta < total - 1) range.push('...')

  range.unshift(1)
  if (total > 1) range.push(total)

  return range
})
</script>

<template>
  <div v-if="safeMeta.totalPages > 1" class="flex justify-center items-center gap-1 mt-6">
    <!-- Кнопка "Назад" -->
    <button
      class="grid size-8 place-content-center rounded border border-white transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rtl:rotate-180 dark:border-gray-400 dark:hover:bg-gray-800 text-gray-400 cursor-pointer"
      @click="emit('prevPage')"
      :disabled="!safeMeta.hasPrev"
      aria-label="Previous page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Номера страниц -->
    <template v-for="(page, index) in pagesRange" :key="index">
      <span v-if="page === '...'" class="size-8 flex items-center justify-center text-white">
        ...
      </span>
      <button
        v-else
        class="size-8 rounded border text-center text-sm/8 font-medium transition-colors cursor-pointer"
        :class="{
          'border-indigo-600 bg-indigo-600 text-white': page === safeMeta.page,
          'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-white':
            page !== safeMeta.page,
        }"
        @click="emit('pageChange', page)"
      >
        {{ page }}
      </button>
    </template>

    <!-- Кнопка "Вперед" -->
    <button
      class="grid size-8 place-content-center rounded border border-white transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rtl:rotate-180 dark:border-gray-400 dark:hover:bg-gray-800 text-gray-400 cursor-pointer"
      @click="emit('nextPage')"
      :disabled="!safeMeta.hasNext"
      aria-label="Next page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>
