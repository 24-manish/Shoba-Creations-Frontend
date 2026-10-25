import { apiClient } from '../lib/apiClient'
import type { EditorialStory, HomepageContent, SiteImages, Testimonial } from '../types/api'

/**
 * Editorial content used to be bundled with the app. It now comes from the
 * database like every other piece of content, so the copy can be edited without
 * a frontend deploy.
 */
export const editorialApi = {
  /** The whole homepage in one request, so it renders in a single pass. */
  getHomepageContent: (signal?: AbortSignal) => apiClient.get<HomepageContent>('/api/content/home', undefined, signal),

  listStories: (limit?: number, signal?: AbortSignal) =>
    apiClient.get<{ stories: EditorialStory[] }>('/api/content/stories', { limit }, signal),

  getStory: (slug: string, signal?: AbortSignal) =>
    apiClient.get<{ story: EditorialStory }>(`/api/content/stories/${encodeURIComponent(slug)}`, undefined, signal),

  listTestimonials: (limit?: number, signal?: AbortSignal) =>
    apiClient.get<{ testimonials: Testimonial[] }>('/api/content/testimonials', { limit }, signal),

  getSiteImages: (signal?: AbortSignal) => apiClient.get<{ images: SiteImages }>('/api/content/images', undefined, signal),
}
