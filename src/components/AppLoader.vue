<template>
  <div
    class="fixed inset-0 z-150 flex items-center justify-center bg-gray-900 opacity-100 backdrop-blur-sm"
  >
    <div class="text-center">
      <!-- Спиннер -->
      <div
        class="inline-block h-15 w-15 animate-spin rounded-full border-8 border-solid border-white border-t-sky-400"
      ></div>

      <!-- Текст -->
      <p class="mt-4 text-lg font-medium text-white">
        <slot>Загрузка...</slot>
      </p>
    </div>
  </div>
</template>
