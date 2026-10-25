import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatCurrency } from '../lib/format'
import { useCart } from '../context/useCart'
import { useCommerceUI } from '../context/useCommerceUI'
import { useWishlist } from '../context/useWishlist'
import { useProduct } from '../hooks/useCatalog'
import { ProductGallery } from '../components/ProductGallery'
import { ProductCard } from '../components/ProductCard'
import { Rating } from '../components/Rating'
import { QuantitySelector } from '../components/QuantitySelector'
import { Ornament } from '../components/Ornament'

const detailTabs = ['Details', 'Craft & care', 'Delivery & returns'] as const

const recentlyViewedKey = 'shoba-creations-recently-viewed'

export function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useProduct(slug)
  const product = data?.product
  const relatedProducts = data?.related ?? []
  const { addItem } = useCart()
  const { openCart } = useCommerceUI()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [selectedColor, setSelectedColor] = useState<string | undefined>()
  const [selectedSize, setSelectedSize] = useState<string | undefined>()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<(typeof detailTabs)[number]>('Details')
  const [added, setAdded] = useState(false)

  // Variants default to the first option once the product has actually loaded.
  useEffect(() => {
    if (!product) return
    setSelectedColor(product.colors[0])
    setSelectedSize(product.sizes[0])
    setQuantity(1)

    try {
      const stored = JSON.parse(window.localStorage.getItem(recentlyViewedKey) ?? '[]') as string[]
      const next = [product.id, ...stored.filter((id) => id !== product.id)].slice(0, 4)
      window.localStorage.setItem(recentlyViewedKey, JSON.stringify(next))
    } catch {
      // A private-mode browser refusing storage is not worth failing the page over.
    }
  }, [product])

  if (isLoading) {
    return <div className="empty-page"><span className="empty-page__mark">SC</span><h1>Gathering this piece…</h1></div>
  }

  if (error || !product) {
    return (
      <div className="empty-page">
        <span className="empty-page__mark">SC</span>
        <h1>{error ? 'We could not find that piece.' : 'That piece has moved on.'}</h1>
        <p>Let us help you find something just as special.</p>
        <Link to="/store/shop" className="button button--dark">Return to the collection</Link>
      </div>
    )
  }

  const wishlisted = isWishlisted(product.id)
  const categoryHref = `/store/shop?category=${encodeURIComponent(product.category ?? '')}`

  const handleAdd = (openDrawer = true) => {
    if (product.stock < 1) return
    addItem(product, quantity, selectedColor, selectedSize)
    setAdded(true)
    if (openDrawer) openCart()
  }

  const handleBuyNow = () => {
    if (product.stock < 1) return
    handleAdd(false)
    navigate('/store/checkout')
  }

  return (
    <div className="detail-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/store">Home</Link><span>·</span><Link to="/store/shop">Shop</Link>
          {product.category ? <><span>·</span><Link to={categoryHref}>{product.category}</Link></> : null}
          <span>·</span><strong>{product.name}</strong>
        </div>
      </div>

      <section className="container detail-layout">
        <ProductGallery product={product} />

        <div className="detail-info">
          <div className="detail-info__topline">
            <span className="eyebrow">{product.subcategory ?? product.category}</span>
            {product.isNew ? <span className="detail-info__new">New arrival</span> : null}
          </div>

          <h1>{product.name}</h1>

          <div className="detail-info__rating">
            <Rating rating={product.rating} reviewCount={product.reviewCount} />
            <span>Hand-selected by Shoba</span>
          </div>

          <div className="detail-info__price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAtPrice ? (
              <><del>{formatCurrency(product.compareAtPrice)}</del>{product.discountLabel ? <span>{product.discountLabel}</span> : null}</>
            ) : null}
          </div>

          <p className="detail-info__description">{product.description}</p>

          <div className="detail-divider" />

          {product.colors.length > 0 ? (
            <div className="detail-option">
              <div className="detail-option__label"><span>Colour</span><strong>{selectedColor}</strong></div>
              <div className="swatch-list">
                {product.colorOptions.length > 0
                  ? product.colorOptions.map((option, index) => (
                    <button
                      type="button"
                      key={option.name}
                      className={`swatch swatch--${product.tone ?? 'ivory'} ${selectedColor === option.name ? 'is-selected' : ''}`}
                      onClick={() => setSelectedColor(option.name)}
                      aria-label={`Select ${option.name}`}
                    >
                      <i style={{ '--swatch-index': index, backgroundColor: option.hex } as CSSProperties} />
                    </button>
                  ))
                  : product.colors.map((name, index) => (
                    <button
                      type="button"
                      key={name}
                      className={`swatch swatch--${product.tone ?? 'ivory'} ${selectedColor === name ? 'is-selected' : ''}`}
                      onClick={() => setSelectedColor(name)}
                      aria-label={`Select ${name}`}
                    >
                      <i style={{ '--swatch-index': index } as CSSProperties} />
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          {product.sizes.length > 0 ? (
            <div className="detail-option">
              <div className="detail-option__label"><span>Size / length</span><Link to="/store#size-guide">Size guide</Link></div>
              <div className="size-list">
                {product.sizes.map((size) => (
                  <button type="button" key={size} className={selectedSize === size ? 'is-selected' : ''} onClick={() => setSelectedSize(size)}>{size}</button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="detail-purchase">
            <div className="detail-purchase__quantity">
              <span>Quantity</span>
              <QuantitySelector value={quantity} min={1} max={Math.max(product.stock, 1)} onChange={setQuantity} />
            </div>

            <div className="detail-purchase__actions">
              <button type="button" className="button button--dark" onClick={() => handleAdd()} disabled={product.stock === 0}>
                {product.stock === 0 ? 'Sold out' : added ? 'Added to bag' : 'Add to bag'}
              </button>
              <button type="button" className="button button--outline" onClick={handleBuyNow} disabled={product.stock === 0}>Buy now</button>
              <button
                type="button"
                className={`button button--text ${wishlisted ? 'is-active' : ''}`}
                onClick={() => toggleWishlist(product.id)}
                aria-pressed={wishlisted}
              >
                {wishlisted ? '♥ Saved' : '♡ Save'}
              </button>
            </div>

            <p className="detail-purchase__stock">{product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}</p>
          </div>
        </div>
      </section>

      <section className="detail-story">
        <div className="container detail-story__grid">
          <div><p className="eyebrow">The story of this piece</p><h2>Crafted to be <em>remembered.</em></h2><Ornament /></div>
          <div>
            <p>{product.description} {product.artisan ? `Made by ${product.artisan}.` : null} Every detail is a conversation between an artisan's hands and the wearer's own story.</p>
            <div className="detail-story__facts">
              <span><small>Origin</small>{product.region ?? 'India'}</span>
              <span><small>Craft</small>{product.fabric ?? 'Hand-finished'}</span>
              <span><small>Collection</small>{product.collection ?? 'The heritage edit'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container detail-tabs">
        <div className="detail-tabs__nav" role="tablist">
          {detailTabs.map((tab) => (
            <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}>{tab}</button>
          ))}
        </div>
        <div className="detail-tabs__content">
          {activeTab === 'Details' ? (
            <ul>{(product.details.length > 0 ? product.details : [product.description]).filter(Boolean).map((detail) => <li key={detail}><span>✦</span>{detail}</li>)}</ul>
          ) : activeTab === 'Craft & care' ? (
            <ul>{(product.care.length > 0 ? product.care : ['Handle with care and store away from direct sunlight.']).map((detail) => <li key={detail}><span>♡</span>{detail}</li>)}</ul>
          ) : (
            <p>Orders are usually dispatched within 2–3 business days. Delivery is calculated at checkout, and we offer an easy 14-day return window on unworn pieces with their original packaging.</p>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="container related-products">
          <div className="home-section__heading-row">
            <div><p className="eyebrow">You may also like</p><h2>Complete the ritual</h2></div>
            {product.category ? <Link to={categoryHref} className="arrow-link">See more {product.category.toLowerCase()} <span>↗</span></Link> : null}
          </div>
          <div className="product-grid product-grid--four">
            {relatedProducts.map((related) => <ProductCard key={related.id} product={related} />)}
          </div>
        </section>
      ) : null}
    </div>
  )
}
