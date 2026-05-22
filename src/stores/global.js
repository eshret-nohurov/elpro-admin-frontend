/*
 * Global API Store
 * Хранит карту API endpoints и общий метод запросов с обработкой авторизации и ошибок.
 */
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'

const toast = useToast()

const statusMessages = {
  400: 'Проверьте заполненные поля. В данных есть ошибка.',
  401: 'Сессия закончилась. Войдите в админку заново.',
  403: 'У вас нет прав для этого действия.',
  404: 'Запись не найдена. Возможно, ее уже удалили.',
  409: 'Конфликт данных. Обновите страницу и попробуйте еще раз.',
  413: 'Файл слишком большой. Загрузите файл меньшего размера.',
  422: 'Не удалось сохранить: проверьте обязательные поля.',
  429: 'Слишком много попыток. Подождите немного и попробуйте снова.',
  500: 'На сервере произошла ошибка. Сообщите администратору.',
  502: 'Сервер временно недоступен. Попробуйте позже.',
  503: 'Сервис временно недоступен. Попробуйте позже.',
}

const technicalMessageMap = [
  {
    test: /Network Error|ERR_NETWORK/i,
    message: 'Нет связи с сервером. Проверьте интернет или доступность сервера.',
  },
  {
    test: /timeout/i,
    message: 'Сервер долго не отвечает. Попробуйте еще раз.',
  },
  {
    test: /jwt expired|token expired/i,
    message: 'Сессия закончилась. Войдите в админку заново.',
  },
  {
    test: /invalid token|jwt malformed|access denied/i,
    message: 'Нужно снова войти в админку.',
  },
  {
    test: /Cast to ObjectId failed|CastError/i,
    message: 'Некорректный идентификатор записи. Обновите страницу и попробуйте снова.',
  },
  {
    test: /validation failed|ValidationError/i,
    message: 'Проверьте заполненные поля. Некоторые данные указаны неверно.',
  },
  {
    test: /E11000|duplicate key/i,
    message: 'Такая запись уже существует.',
  },
  {
    test: /Cannot read properties|undefined|null/i,
    message: 'Не хватает данных для выполнения действия. Обновите страницу и попробуйте снова.',
  },
]

const getReadableErrorMessage = (error) => {
  const serverMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.details
  const rawMessage = String(serverMessage || error.message || '')
  const mappedMessage = technicalMessageMap.find((item) => item.test.test(rawMessage))?.message

  if (mappedMessage) return mappedMessage
  if (serverMessage) return serverMessage
  if (error.response?.status && statusMessages[error.response.status]) return statusMessages[error.response.status]
  if (error.request) return 'Нет ответа от сервера. Проверьте подключение.'

  return 'Произошла ошибка. Попробуйте еще раз.'
}

export const useGlobalStore = defineStore('global', {
  state: () => ({
    api: {
      baseURL: import.meta.env.VITE_API_URL,
      endpoints: {
        login: '/auth/login',
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
        delete_order: (id) => `/orders/${id}`,
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
        const authStore = useAuthStore()
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

        return response.data
      } catch (err) {
        this.handleError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    handleError(error) {
      const authStore = useAuthStore()
      const message = getReadableErrorMessage(error)

      if (error.response?.status === 401) {
        authStore.logout()
      }

      if (error.response) {
        this.error = message
      } else if (error.request) {
        this.error = message
      } else {
        this.error = message
      }

      toast.error(message)
      console.error('API Error:', {
        message,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        response: error.response?.data,
        originalMessage: error.message,
      })
    },

    clearError() {
      this.error = null
    },
  },
})
