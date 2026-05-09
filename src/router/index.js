/*
 * Admin Router
 * Описывает разделы админки, права доступа и вложенную структуру страниц управления.
 */
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/dashboard',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/DashboardView.vue'),
      },

      {
        path: '/orders',
        name: 'Orders',
        meta: { requiresAuth: true },
        component: () => import('@/views/OrdersView.vue'),
      },
      {
        path: '/orders/create',
        name: 'Create Order',
        meta: { requiresAuth: true },
        component: () => import('@/views/OrderFormView.vue'),
      },
      {
        path: '/orders/edit/:id',
        name: 'Edit Order',
        meta: { requiresAuth: true },
        component: () => import('@/views/OrderFormView.vue'),
        props: true,
      },

      {
        path: '/navigation',
        name: 'Navigation',
        meta: { requiresAuth: true },
        redirect: '/navigation/categories',
        component: () => import('@/views/navigation/NavigationWrapper.vue'),
        children: [
          {
            path: '/navigation/categories',
            name: 'Categories',
            meta: { requiresAuth: true },
            component: () => import('@/views/navigation/categories/ListView.vue'),
          },
          {
            path: '/navigation/categories/create',
            name: 'Create Category',
            meta: { requiresAuth: true },
            component: () => import('@/views/navigation/categories/CreateView.vue'),
          },
          {
            path: '/navigation/categories/edit/:id',
            name: 'Edit Category',
            meta: { requiresAuth: true },
            component: () => import('@/views/navigation/categories/EditView.vue'),
            props: true,
          },


          {
            path: '/navigation/subcategories',
            name: 'Subcategories',
            meta: { requiresAuth: true },
            component: () => import('@/views/navigation/subCategories/ListView.vue'),
          },
          {
            path: '/navigation/subcategories/create',
            name: 'Create Subcategory',
            meta: { requiresAuth: true },
            component: () => import('@/views/navigation/subCategories/CreateView.vue'),
          },
          {
            path: '/navigation/subcategories/edit/:id',
            name: 'Edit SubCategory',
            meta: { requiresAuth: true },
            component: () => import('@/views/navigation/subCategories/EditView.vue'),
            props: true,
          },
        ],
      },

      {
        path: '/main-page',
        name: 'Main Page',
        meta: { requiresAuth: true },
        component: () => import('@/views/main_page/MainPageWrapper.vue'),
        children: [

          {
            path: '/main-page/main-banner',
            name: 'Main Banner',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/main_banner/ListView.vue'),
          },
          {
            path: '/main-page/main-banner/create',
            name: 'Create Main Banner Slide',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/main_banner/CreateView.vue'),
          },
          {
            path: '/main-page/main-banner/edit/:id',
            name: 'Edit Main Banner',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/main_banner/EditView.vue'),
            props: true,
          },


          {
            path: '/main-page/promo-banner',
            name: 'Promo Banner',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/promo_banner/ListView.vue'),
          },
          {
            path: '/main-page/promo-banner/create',
            name: 'Create Promo Banner Slide',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/promo_banner/CreateView.vue'),
          },
          {
            path: '/main-page/promo-banner/edit/:id',
            name: 'Edit Promo Banner',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/promo_banner/EditView.vue'),
            props: true,
          },


          {
            path: '/main-page/products-section',
            name: 'Products Section',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/products_section/ListView.vue'),
          },
          {
            path: '/main-page/products-section/create',
            name: 'Create Products Section',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/products_section/CreateView.vue'),
          },
          {
            path: '/main-page/products-section/edit/:id',
            name: 'Edit Products Section',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/products_section/EditView.vue'),
            props: true,
          },


          {
            path: '/main-page/footer-banner',
            name: 'Footer Banner',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/footer_banner/ListView.vue'),
          },
          {
            path: '/main-page/footer-banner/create',
            name: 'Create Footer Banner Slide',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/footer_banner/CreateView.vue'),
          },
          {
            path: '/main-page/footer-banner/edit/:id',
            name: 'Edit Footer Banner',
            meta: { requiresAuth: true },
            component: () => import('@/views/main_page/footer_banner/EditView.vue'),
            props: true,
          },
        ],
      },

      {
        path: '/products',
        name: 'Products',
        meta: { requiresAuth: true },
        component: () => import('@/views/products/ProductsWrapper.vue'),
        children: [
          {
            path: '/products/list',
            name: 'Product List',
            meta: { requiresAuth: true },
            component: () => import('@/views/products/ListView.vue'),
          },
          {
            path: '/products/create',
            name: 'Create Product',
            meta: { requiresAuth: true },
            component: () => import('@/views/products/CreateView.vue'),
          },
          {
            path: '/products/edit/:id',
            name: 'Edit Product',
            meta: { requiresAuth: true },
            component: () => import('@/views/products/EditView.vue'),
            props: true,
          },
        ],
      },

      {
        path: '/users',
        name: 'Users',
        meta: { requiresAuth: true, role: 'admin' },
        component: () => import('@/views/users/UsersWrapper.vue'),
        children: [
          {
            path: '/users/list',
            name: 'User List',
            meta: { requiresAuth: true, role: 'admin' },
            component: () => import('@/views/users/ListView.vue'),
          },
          {
            path: '/users/create',
            name: 'Create User',
            meta: { requiresAuth: true, role: 'admin' },
            component: () => import('@/views/users/CreateView.vue'),
          },
          {
            path: '/users/edit/:id',
            name: 'Edit Users',
            meta: { requiresAuth: true, role: 'admin' },
            component: () => import('@/views/users/EditView.vue'),
            props: true,
          },
        ],
      },

      {
        path: '/settings',
        name: 'Settings',
        meta: { requiresAuth: true, role: 'admin' },
        component: () => import('@/views/SettingsView.vue'),
      },
      {
        path: '/logs',
        name: 'Logs',
        meta: { requiresAuth: true, role: 'admin' },
        component: () => import('@/views/LogsView.vue'),
      },
    ],
  },

  {
    path: '/auth',
    name: 'Auth',
    redirect: '/auth/login',
    meta: { requiresAuth: false },
    component: AuthLayout,
    children: [
      {
        path: '/auth/login',
        name: 'Login',
        meta: { requiresAuth: false },
        component: () => import('@/views/auth/LoginView.vue'),
      },
      {
        path: '/auth/registration',
        name: 'Registration',
        meta: { requiresAuth: false },
        component: () => import('@/views/auth/RegistrationView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    authStore.logout()
    next('/auth/login')
  } else if (to.path === '/auth/login' && authStore.isAuthenticated()) {
    next('/')
  } else if (to.meta.role && authStore.user.role !== to.meta.role) {
    next('/forbidden')
  } else {
    next()
  }
})

export default router
