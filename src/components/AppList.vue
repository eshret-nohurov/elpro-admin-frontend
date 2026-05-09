<script setup>
/*
 * List Shell
 * Дает общий каркас спискам с пагинацией, загрузкой и единым поведением таблиц.
 */
import AppEmpty from '@/components/AppEmpty.vue'
import AppPagination from '@/components/AppPagination.vue'
import { computed } from 'vue'

const props = defineProps({
  listHead: {
    type: Array,
    required: true,
  },
  listData: {
    type: Array,
    required: true,
  },
  listVal: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  addButtName: {
    type: String,
    required: true,
  },
  addButtRoute: {
    type: String,
    required: true,
  },
  editButtRoute: {
    type: String,
    required: true,
  },
  lengthLimit: {
    type: Boolean,
    default: false,
  },
  addButtLimitTXT: {
    type: String,
    default: '',
  },
  meta: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['deleteData', 'prevPage', 'nextPage', 'pageChange'])


const prevPage = () => {
  emit('prevPage')
}

const nextPage = () => {
  emit('nextPage')
}

const pageChange = (page) => {
  emit('pageChange', page)
}

const startIndex = computed(() => {
  if (!props.meta || !props.meta.page || !props.meta.limit) return 0
  return (props.meta.page - 1) * props.meta.limit
})
</script>

<template>
  <div class="overflow-hidden rounded-lg bg-gray-900 p-3 sm:p-4">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-lg font-semibold text-white">{{ props.title }}</h2>
      <RouterLink
        class="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:w-auto"
        :to="props.addButtRoute"
        v-if="!props.lengthLimit"
      >
        {{ props.addButtName }}
      </RouterLink>

      <div class="flex flex-col items-center gap-2" v-else>
        <div
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-950 rounded-lg cursor-not-allowed"
        >
          {{ props.addButtName }}
        </div>

        <span class="text-white text-sm">{{ props.addButtLimitTXT }}</span>
      </div>
    </div>

    <AppEmpty v-if="!props.listData.length" />

    <div v-else class="space-y-3 md:hidden">
      <article
        v-for="(item, index) in props.listData"
        :key="item._id || index"
        class="rounded-xl border border-slate-700 bg-gray-950 p-4 text-white"
      >
        <div class="mb-3 flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <span class="text-xs uppercase tracking-wide text-gray-400">#{{ startIndex + index + 1 }}</span>
          <div class="flex gap-2">
            <RouterLink
              class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
              :to="props.editButtRoute + '/' + item._id"
            >
              Edit
            </RouterLink>
            <button
              @click="emit('deleteData', item)"
              class="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Delete
            </button>
          </div>
        </div>

        <dl class="space-y-2">
          <div
            v-for="(listVal, index) in props.listVal"
            :key="listVal"
            class="grid grid-cols-[42%_1fr] gap-3 text-sm"
          >
            <dt class="text-gray-400">{{ props.listHead[index + 1] || listVal }}</dt>
            <dd class="min-w-0 break-words text-gray-100">{{ item[listVal] }}</dd>
          </div>
        </dl>
      </article>
    </div>

    <div v-if="props.listData.length" class="hidden overflow-x-auto md:block">
      <table class="min-w-full divide-y-2 divide-gray-200 dark:divide-gray-700 mb-7">
      <thead class="ltr:text-left rtl:text-right">
        <tr class="*:font-medium *:text-gray-900 dark:*:text-white">
          <th
            class="px-3 py-2 whitespace-nowrap"
            v-for="(item, index) in props.listHead"
            :key="index"
          >
            {{ item }}
          </th>
        </tr>
      </thead>

      <tbody
        class="divide-y divide-gray-200 *:even:bg-gray-50 dark:divide-gray-700 dark:*:even:bg-gray-800"
      >
        <tr
          v-for="(item, index) in props.listData"
          :key="index"
          class="*:text-gray-900 *:first:font-medium dark:*:text-white h-18"
        >
          <td class="px-3 whitespace-nowrap w-15" v-if="Object.keys(props.meta).length > 0">
            {{ startIndex + index + 1 }}
          </td>
          <td class="px-3 whitespace-nowrap w-15" v-else>{{ index + 1 }}</td>
          <td class="px-3 whitespace-nowrap" v-for="(listVal, index) in props.listVal" :key="index">
            {{ item[listVal] }}
          </td>
          <td class="px-1 whitespace-nowrap text-center w-20">
            <RouterLink
              class="bg-indigo-600 hover:bg-indigo-700 h-10 flex items-center justify-center"
              :to="props.editButtRoute + '/' + item._id"
            >
              Edit
            </RouterLink>
          </td>
          <td class="px-1 whitespace-nowrap text-center w-20">
            <button
              @click="emit('deleteData', item)"
              class="bg-red-500 hover:bg-red-600 h-10 flex items-center justify-center w-full cursor-pointer"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <AppPagination
      @prev-page="prevPage"
      @next-page="nextPage"
      :meta="props.meta"
      @pageChange="pageChange"
    />
  </div>
</template>
