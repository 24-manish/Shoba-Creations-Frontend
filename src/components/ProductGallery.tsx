import { useState } from 'react'
import { HeritageImage } from './HeritageImage'
import { ProductVisualPlaceholder } from './ProductVisualPlaceholder'
import type { Product } from '../types/api'

interface ProductGalleryProps {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = Math.min(activeIndex, Math.max(product.images.length - 1, 0))
  const activeImage = product.images[safeActiveIndex]

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        {activeImage ? <HeritageImage src={activeImage.src} alt={activeImage.alt} loading="eager" sizes="(max-width: 900px) 100vw, 58vw" /> : <ProductVisualPlaceholder tone={product.tone} name={product.name} />}
        <span className="product-gallery__stamp" aria-hidden="true">SC</span>
        {product.badge ? <span className="product-gallery__badge">{product.badge}</span> : null}
      </div>
      {product.images.length > 1 ? (
        <div className="product-gallery__thumbs" aria-label="Product images">
          {product.images.map((image, index) => (
            <button
              type="button"
              key={image.src}
              className={`product-gallery__thumb ${index === safeActiveIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${product.images.length}`}
            >
              <HeritageImage src={image.src} alt={image.alt} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
