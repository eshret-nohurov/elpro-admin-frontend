/*
 * Media URLs
 * Собирает публичные ссылки на файлы backend и не дает браузеру открывать локальные пути сервера.
 */
const mediaBaseUrl = () => (import.meta.env.VITE_API_URL || '').replace(/\/api\/admin\/?$/, '')

export const resolveMediaUrl = (path = '') => {
  if (!path || path instanceof File) return ''
  if (/^blob:|^data:|^https?:\/\//i.test(path)) return path
  return `${mediaBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
