import type { ImgHTMLAttributes } from 'react'
import { resolveMediaUrl } from '../lib/media'

interface HeritageImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  sizes?: string
}

export function HeritageImage({ className = '', sizes, alt, src, ...props }: HeritageImageProps) {
  return <img className={`heritage-image ${className}`.trim()} sizes={sizes} alt={alt} src={resolveMediaUrl(src)} {...props} />
}