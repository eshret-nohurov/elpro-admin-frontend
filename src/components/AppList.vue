<script setup>
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

// Добавляем обработчики для пагинации
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
  return (props.meta.page - 1) * props.meta.limit
})
</script>

<template>
  <div class="overflow-x-auto bg-gray-900 p-4 rounded-lg">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ props.title }}</h2>
      <RouterLink
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-600"
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

    <table v-else class="min-w-full divide-y-2 divide-gray-200 dark:divide-gray-700 mb-7">
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

    <AppPagination
      @prev-page="prevPage"
      @next-page="nextPage"
      :meta="props.meta"
      @pageChange="pageChange"
    />
  </div>
</template>
