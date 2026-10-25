import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../lib/format'
import { useCart } from '../context/useCart'
import { useCommerceUI } from '../context/useCommerceUI'
import { useWishlist } from '../context/useWishlist'
import type { Product } from '../types/api'
import { ProductVisual } from './ProductVisual'
import { Rating } from './Rating'

interface ProductCardProps {
  product: Product
  featured?: boolean
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const { addItem } = useCart()
  const { openCart } = useCommerceUI()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [added, setAdded] = useState(false)
  const wishlisted = isWishlisted(product.id)

  const handleAdd = () => {
    if (product.stock < 1) return
    addItem(product, 1, product.colors[0], product.sizes.length > 0 ? product.sizes[0] : undefined)
    setAdded(true)
    openCart()
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article className={`product-card ${featured ? 'product-card--featured' : ''}`}>
      <div className="product-card__media">
        <Link to={`/store/product/${product.slug}`} className="product-card__link" aria-label={`View ${product.name}`}>
          <ProductVisual product={product} />
        </Link>
        <button
          type="button"
          className={`icon-button product-card__wishlist ${wishlisted ? 'is-active' : ''}`}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={() => toggleWishlist(product.id)}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
        <div className="product-card__quick-view">
<button type="button" className="button button--small button--dark" onClick={handleAdd} disabled={product.stock === 0}>
             {product.stock === 0 ? 'Sold out' : added ? 'Added to bag' : 'Add to bag'}
           </button>
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.subcategory}</span>
          {product.compareAtPrice ? <span className="product-card__discount">{product.discountLabel}</span> : null}
        </div>
        <Link to={`/store/product/${product.slug}`} className="product-card__name">{product.name}</Link>
        <div className="product-card__footer">
          <div className="product-card__price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAtPrice ? <del>{formatCurrency(product.compareAtPrice)}</del> : null}
          </div>
          <Rating rating={product.rating} reviewCount={product.reviewCount} compact />
        </div>
      </div>
    </article>
  )
}
