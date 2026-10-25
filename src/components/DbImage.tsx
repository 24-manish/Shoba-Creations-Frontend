import { HeritageImage } from './HeritageImage'
import { ProductVisualPlaceholder } from './ProductVisualPlaceholder'
import type { SiteImage } from '../types/api'

interface DbImageProps {
  image: SiteImage | null | undefined
  /** Used for the generated fallback while the image row is missing. */
  fallbackName: string
  className?: string
  loading?: 'eager' | 'lazy'
}

/**
 * Renders a site image row from the database. Editorial imagery is data, not
 * build output, so a page that has no row yet degrades to a generated visual
 * rather than pointing at a hardcoded asset path.
 */
export function DbImage({ image, fallbackName, className = '', loading = 'lazy' }: DbImageProps) {
  if (!image) {
    return <ProductVisualPlaceholder tone="ivory" name={fallbackName} />
  }

  return <HeritageImage className={className} src={image.url} alt={image.alt || fallbackName} loading={loading} />
}
