<script setup>
defineProps({
  isOpen: Boolean,
})

const emit = defineEmits(['close'])

const onClose = () => emit('close')
</script>

<template>
  <div
    class="fixed inset-0 z-50 grid place-content-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modalTitle"
    v-show="isOpen"
    @click.self="onClose"
  >
    <div class="w-[100%] p-10 m-auto shadow-lg rounded-2xl bg-gray-900">
      <div class="w-full h-full">
        <div class="flex flex-col justify-between h-full text-gray-200">
          <h1 class="text-3xl font-bold text-blue-400 border-b-2 border-blue-500 pb-2 mb-6">
            Требования к изображениям
          </h1>

          <p class="mb-6 text-gray-300">
            Для корректного отображения на сайте загружаемые изображения должны соответствовать
            следующим параметрам:
          </p>


          <div class="bg-dark-800 border-l-4 border-blue-500 p-6 rounded-lg mb-6 shadow-lg">
            <h2 class="text-xl font-semibold text-blue-300 mb-4">Основные параметры</h2>
            <ul class="space-y-3 list-disc pl-5">
              <li><span class="font-medium">Формат файла:</span> JPG, JPEG или PNG</li>
              <li>
                <span class="font-medium">Соотношение сторон:</span>
                <span class="font-bold"> 21:9 </span>
                <span class="text-blue-300">для промо баннеров это требование ниже!</span>
              </li>
              <li>
                <span class="font-medium">Разрешение:</span> не менее
                <span class="font-bold"> 2560x1080 пикселей </span>
                <span class="text-blue-300">для промо баннеров это требование ниже!</span>
              </li>
              <li>
                <span class="font-medium">Максимальный размер файла:</span>
                <span class="font-bold"> 5 МБ</span> (рекомендуется сжатие без потери качества)
              </li>
            </ul>
          </div>


          <div class="bg-dark-800 border-l-4 border-blue-400 px-6 pb-2 rounded-lg mb-6 shadow-lg">
            <h2 class="text-xl font-semibold text-blue-300 my-2">1-ый Промо Баннер</h2>
            <ul class="space-y-3 list-disc pl-5">
              <li>
                <span class="font-medium">Соотношение сторон:</span>
                <span class="font-bold"> 21:9 </span>
              </li>
              <li>
                <span class="font-medium">Разрешение:</span> не менее
                <span class="font-bold">2560x1080 пикселей</span>
              </li>
            </ul>

            <h2 class="text-xl font-semibold text-blue-300 my-2">
              2-ой Промо Баннер и 3-ий Промо Баннер
            </h2>
            <ul class="space-y-3 list-disc pl-5">
              <li>
                <span class="font-medium">Соотношение сторон:</span>
                <span class="font-bold"> 4:3 </span>
              </li>
              <li>
                <span class="font-medium">Разрешение:</span> не менее
                <span class="font-bold">1024x768 пикселей</span>
              </li>
            </ul>

            <h2 class="text-xl font-semibold text-blue-300 my-2">4-ий Промо Баннер</h2>
            <ul class="space-y-3 list-disc pl-5">
              <li>
                <span class="font-medium">Соотношение сторон:</span>
                <span class="font-bold"> 1:1 </span>
              </li>
              <li>
                <span class="font-medium">Разрешение:</span> не менее
                <span class="font-bold">1000x1000 пикселей</span>
              </li>
            </ul>
          </div>

          <p class="italic text-gray-400">
            Несоответствующие изображения могут быть отклонены системой.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
