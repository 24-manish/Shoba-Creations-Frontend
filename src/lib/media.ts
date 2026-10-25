import { API_BASE_URL } from './apiClient'

/**
 * Backend media (uploaded product and site images) lives on the API host under
 * /uploads and comes back as a relative path. Browser image elements resolve
 * relative paths against the page's own origin, which in this app is the
 * storefront, not the API. Relative paths are therefore pinned to the API base
 * while absolute ones (seeded Unsplash URLs, blob previews, data URIs) pass
 * through untouched.
 */
export const resolveMediaUrl = (src: string | null | undefined): string => {
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src)) return src
  if (src.startsWith('/')) return `${API_BASE_URL}${src}`
  return src
}