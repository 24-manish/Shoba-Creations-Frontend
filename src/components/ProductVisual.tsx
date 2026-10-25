import { HeritageImage } from './HeritageImage'
import { ProductVisualPlaceholder } from './ProductVisualPlaceholder'
import type { Product } from '../types/api'

interface ProductVisualProps {
  product: Product
  className?: string
  eager?: boolean
  showBadge?: boolean
}

export function ProductVisual({ product, className = '', eager = false, showBadge = true }: ProductVisualProps) {
  return (
    <div className={`product-visual product-visual--${product.tone} ${className}`.trim()}>
      {product.images.length > 0 ? <HeritageImage
        src={product.images[0].src}
        alt={product.images[0].alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        sizes="(max-width: 720px) 100vw, (max-width: 1100px) 45vw, 30vw"
      /> : <ProductVisualPlaceholder tone={product.tone} name={product.name} />}
      {showBadge && product.badge ? <span className="product-visual__badge">{product.badge}</span> : null}
      {product.isNew && !product.badge ? <span className="product-visual__badge">New arrival</span> : null}
    </div>
  )
}
