import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'

const toast = useToast()
const authStore = useAuthStore()

export const useGlobalStore = defineStore('global', {
  state: () => ({
    api: {
      baseURL: import.meta.env.VITE_API_URL,
      endpoints: {
        login: '/auth/login',

        //categoies
        categories: '/categories',
        categoriesForSubcategory: '/categories-for-subcategory',
        category: (id) => `/category/${id}`,
        create_category: '/create_category',
        update_category: (id) => `/update_category/${id}`,
        delete_category: (id) => `/delete_category/${id}`,

        // subcategoies
        subcategories: '/subcategories',
        subcategory: (id) => `/subcategory/${id}`,
        create_subcategory: '/create_subcategory',
        update_subcategory: (id) => `/update_subcategory/${id}`,
        delete_subcategory: (id) => `/delete_subcategory/${id}`,

        // main banner
        main_banner_slides: '/main_banner_slides',
        main_banner_slide: (id) => `/main_banner_slide/${id}`,
        create_main_banner_slide: '/create_main_banner_slide',
        update_main_banner_slide: (id) => `/update_main_banner_slide/${id}`,
        delete_main_banner_slide: (id) => `/delete_main_banner_slide/${id}`,

        // promo banner
        promo_banner_slides: '/promo_banner_slides',
        promo_banner_slide: (id) => `/promo_banner_slide/${id}`,
        create_promo_banner_slide: '/create_promo_banner_slide',
        update_promo_banner_slide: (id) => `/update_promo_banner_slide/${id}`,
        delete_promo_banner_slide: (id) => `/delete_promo_banner_slide/${id}`,

        // footer banner
        footer_banner_slides: '/footer_banner_slides',
        footer_banner_slide: (id) => `/footer_banner_slide/${id}`,
        create_footer_banner_slide: '/create_footer_banner_slide',
        update_footer_banner_slide: (id) => `/update_footer_banner_slide/${id}`,
        delete_footer_banner_slide: (id) => `/delete_footer_banner_slide/${id}`,

        // product
        products: '/products',
        product: (id) => `/product/${id}`,
        create_product: '/create_product',
        update_product: (id) => `/update_product/${id}`,
        selected_subcategories: '/selected_subcategories',
        search_products: '/search_products',
        delete_product: (id) => `/delete_product/${id}`,

        // products sections
        products_section: '/products_section',
        section: (id) => `/products_section/${id}`,
        create_products_section: '/create_products_section',
        update_products_section: (id) => `/update_products_section/${id}`,
        delete_products_section: (id) => `/delete_products_section/${id}`,

        // User
        users: '/users',
        user: (id) => `/users/${id}`,
        create_user: '/users/create',
        update_user: (id) => `/users/update/${id}`,
        delete_user: (id) => `/users/delete/${id}`,

        // Settings
        settings: '/settings',
        create_settings: '/settings/create',
        update_settings: (id) => `/settings/update/${id}`,
      },
    },

    isLoading: false,
    error: null,
  }),

  actions: {
    async makeApiRequest({
      method = 'GET',
      url,
      data = null,
      params = null,
      headers = {},
      requreAuth = true,
    }) {
      this.isLoading = true
      this.error = null

      try {
        const fullUrl = this.api.baseURL + url
        const response = await axios({
          method,
          url: fullUrl,
          data,
          params,
          headers: requreAuth
            ? {
                Authorization: `Bearer ${authStore.token}`,
                ...headers,
              }
            : headers,
        })

        console.log(response)

        return response.data
      } catch (err) {
        this.handleError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    handleError(error) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // this.error = 'Ошибка авторизации. Пожалуйста, войдите снова.'
            authStore.logout()
            break
          case 403:
            // this.error = 'Доступ запрещён.'
            break
          case 404:
            // this.error = 'Ресурс не найден.'
            break
          case 500:
            // this.error = 'Ошибка сервера. Попробуйте позже.'
            break
          default:
          // this.error = 'Произошла ошибка: ' + error.response.data.message
        }
      } else if (error.request) {
        this.error = 'Нет ответа от сервера. Проверьте подключение.'
      } else {
        this.error = 'Ошибка при отправке запроса: ' + error.message
      }

      // toast.error(this.error || 'Произошла ошибка при выполнении запроса.')
      toast.error(error.response.data.error)
      console.error('API Error:', error.response.data.error)
    },

    clearError() {
      this.error = null
    },
  },
})
