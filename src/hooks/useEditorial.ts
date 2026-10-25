import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { editorialApi } from '../services/editorialApi'

/**
 * The homepage's editorial content, previously hardcoded in the bundle. It is
 * cached hard because editorial copy changes on a publishing cadence, not on a
 * navigation.
 */
export const useHomepageContent = () =>
  useQuery({
    queryKey: queryKeys.content.home,
    queryFn: ({ signal }) => editorialApi.getHomepageContent(signal),
    staleTime: 10 * 60_000,
  })

export const useEditorialStories = (limit?: number) =>
  useQuery({
    queryKey: queryKeys.content.stories,
    queryFn: ({ signal }) => editorialApi.listStories(limit, signal),
  })

export const useEditorialStory = (slug: string | undefined) =>
  useQuery({
    queryKey: queryKeys.content.story(slug ?? ''),
    queryFn: ({ signal }) => editorialApi.getStory(slug as string, signal),
    enabled: Boolean(slug),
  })

export const useTestimonials = (limit?: number) =>
  useQuery({
    queryKey: queryKeys.content.testimonials,
    queryFn: ({ signal }) => editorialApi.listTestimonials(limit, signal),
  })

export const useSiteImages = () =>
  useQuery({
    queryKey: queryKeys.content.images,
    queryFn: ({ signal }) => editorialApi.getSiteImages(signal),
  })
