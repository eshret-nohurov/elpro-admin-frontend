/*
 * Global API Store
 * Хранит карту API endpoints и общий метод запросов с обработкой авторизации и ошибок.
 */
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
        captcha: '/auth/captcha',
        dashboard: '/dashboard',
        logs: '/logs',
        log_users: '/logs/users',


        categories: '/categories',
        categoriesForList: '/categories-for-list',
        category: (id) => `/category/${id}`,
        create_category: '/create_category',
        update_category: (id) => `/update_category/${id}`,
        delete_category: (id) => `/delete_category/${id}`,


        subcategories: '/subcategories',
        subcategory: (id) => `/subcategory/${id}`,
        create_subcategory: '/create_subcategory',
        update_subcategory: (id) => `/update_subcategory/${id}`,
        delete_subcategory: (id) => `/delete_subcategory/${id}`,


        main_banner_slides: '/main_banner_slides',
        main_banner_slide: (id) => `/main_banner_slide/${id}`,
        create_main_banner_slide: '/create_main_banner_slide',
        update_main_banner_slide: (id) => `/update_main_banner_slide/${id}`,
        delete_main_banner_slide: (id) => `/delete_main_banner_slide/${id}`,


        promo_banner_slides: '/promo_banner_slides',
        promo_banner_slide: (id) => `/promo_banner_slide/${id}`,
        create_promo_banner_slide: '/create_promo_banner_slide',
        update_promo_banner_slide: (id) => `/update_promo_banner_slide/${id}`,
        delete_promo_banner_slide: (id) => `/delete_promo_banner_slide/${id}`,


        footer_banner_slides: '/footer_banner_slides',
        footer_banner_slide: (id) => `/footer_banner_slide/${id}`,
        create_footer_banner_slide: '/create_footer_banner_slide',
        update_footer_banner_slide: (id) => `/update_footer_banner_slide/${id}`,
        delete_footer_banner_slide: (id) => `/delete_footer_banner_slide/${id}`,


        products: '/products',
        product: (id) => `/product/${id}`,
        create_product: '/create_product',
        update_product: (id) => `/update_product/${id}`,
        selected_subcategories: '/selected_subcategories',
        search_products: '/search_products',
        delete_product: (id) => `/delete_product/${id}`,


        products_section: '/products_section',
        section: (id) => `/products_section/${id}`,
        create_products_section: '/create_products_section',
        update_products_section: (id) => `/update_products_section/${id}`,
        delete_products_section: (id) => `/delete_products_section/${id}`,


        users: '/users',
        user: (id) => `/users/${id}`,
        create_user: '/users/create',
        update_user: (id) => `/users/update/${id}`,
        delete_user: (id) => `/users/delete/${id}`,


        settings: '/settings',
        create_settings: '/settings/create',
        update_settings: (id) => `/settings/update/${id}`,


        orders: '/orders',
        order: (id) => `/orders/${id}`,
        create_order: '/orders/create',
        update_order: (id) => `/orders/${id}/update`,
        update_order_status: (id) => `/orders/${id}/status`,
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

            authStore.logout()
            break
          case 403:

            break
          case 404:

            break
          case 500:

            break
          default:

        }
      } else if (error.request) {
        this.error = 'Нет ответа от сервера. Проверьте подключение.'
      } else {
        this.error = 'Ошибка при отправке запроса: ' + error.message
      }


      const message = error.response?.data?.error || error.response?.data?.message || this.error
      toast.error(message || 'Произошла ошибка')
      console.error('API Error:', message)
    },

    clearError() {
      this.error = null
    },
  },
})
