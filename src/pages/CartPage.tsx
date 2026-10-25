import { Link } from 'react-router-dom'
import { formatCurrency } from '../lib/format'
import { useCart } from '../context/useCart'
import { useFeaturedProducts } from '../hooks/useCatalog'
import { QuantitySelector } from '../components/QuantitySelector'
import { HeritageImage } from '../components/HeritageImage'
import { ProductVisualPlaceholder } from '../components/ProductVisualPlaceholder'
import { Ornament } from '../components/Ornament'
import { ProductCard } from '../components/ProductCard'

export function CartPage() {
  const { items, cartCount, subtotal, updateQuantity, removeItem, clearCart, isGuest } = useCart()
  const { data: featured } = useFeaturedProducts()

  // Suggestions come from the featured rail, minus anything already in the bag.
  const recommendations = (featured?.products ?? [])
    .filter((product) => !items.some((item) => item.productId === product.id))
    .slice(0, 3)

  if (items.length === 0) {
    return <div className="empty-page empty-page--cart"><div className="empty-page__mark">SC</div><p className="eyebrow">Your selection</p><h1>Your bag is waiting.</h1><p>Bring a little story home. Explore the collection and choose something made to be kept.</p><div className="empty-page__actions"><Link to="/store/shop" className="button button--dark">Explore the collection</Link><Link to="/store/wishlist" className="button button--outline">View wishlist</Link></div></div>
  }

  return (
    <div className="cart-page">
      <section className="container cart-heading">
        <div className="breadcrumbs"><Link to="/store">Home</Link><span>·</span><strong>Shopping bag</strong></div>
        <p className="eyebrow">Your selection</p>
        <h1>Shopping bag <small>({cartCount})</small></h1>
        <p>Pieces chosen for you, ready to become part of your story.</p>
      </section>

      <section className="container cart-layout">
        <div className="cart-items">
          <div className="cart-items__top">
            <span>{cartCount} {cartCount === 1 ? 'piece' : 'pieces'}</span>
            <button type="button" className="text-button" onClick={clearCart}>Clear bag</button>
          </div>

          {items.map((item) => (
            <article className="cart-line" key={item.key}>
              <Link to={`/store/product/${item.slug}`} className="cart-line__image">
                {item.imageUrl
                  ? <HeritageImage src={item.imageUrl} alt={item.name} loading="lazy" />
                  : <ProductVisualPlaceholder tone={item.tone} name={item.name} />}
              </Link>
              <div className="cart-line__details">
                <div className="cart-line__heading">
                  <div>
                    <span className="eyebrow">{item.category}</span>
                    <Link to={`/store/product/${item.slug}`}><h2>{item.name}</h2></Link>
                  </div>
                  <strong>{formatCurrency(item.lineTotal)}</strong>
                </div>
                <div className="cart-line__meta">
                  {item.selectedColor ? <span>Colour: {item.selectedColor}</span> : null}
                  {item.selectedSize ? <span>Size: {item.selectedSize}</span> : null}
                  {!item.selectedColor && !item.selectedSize ? <span>Standard</span> : null}
                </div>
                <div className="cart-line__actions">
                  <QuantitySelector
                    value={item.quantity}
                    min={1}
                    max={item.stock}
                    onChange={(quantity) => updateQuantity(item.productId, quantity, item.selectedColor, item.selectedSize)}
                  />
                  <button type="button" className="text-button text-button--muted" onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}>Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="order-summary">
          <p className="eyebrow">Your order</p>
          <h2>Summary</h2>
          <div className="order-summary__rows">
            {/* Delivery is priced by the server at checkout, so it is not guessed here. */}
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>Delivery</span><strong>Calculated at checkout</strong></div>
          </div>
          <Ornament compact />
          <Link to="/store/checkout" className="button button--dark button--full">Proceed to checkout</Link>
          {isGuest ? (
            <p className="order-summary__note">
              Your bag is saved on this device.{' '}
              <Link to="/store/login" state={{ from: '/store/checkout' }}>Sign in</Link> to keep it on your account.
            </p>
          ) : null}
        </aside>
      </section>

      {recommendations.length > 0 ? (
        <section className="container cart-recommendations">
          <div className="home-section__heading-row">
            <div><p className="eyebrow">Before you go</p><h2>A few more for the story</h2></div>
            <Link to="/store/shop" className="arrow-link">Explore all <span>↗</span></Link>
          </div>
          <div className="product-grid product-grid--three">
            {recommendations.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ) : null}
    </div>
  )
}
