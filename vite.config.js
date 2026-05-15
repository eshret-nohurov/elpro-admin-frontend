/*
 * Vite Runtime
 * Настраивает сборку админки, переменные окружения, алиасы и dev-сервер.
 */
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    define: {
      'process.env': env,
    },
    plugins: [vue(), vueDevTools(), tailwindcss()],
    base: '/',
    resolve: {
      alias: [
        {
          find: /^~(.*)$/,
          replacement: '$1',
        },
        {
          find: '@/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '/src'),
        },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.scss'],
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
  }
})
