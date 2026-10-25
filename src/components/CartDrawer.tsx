import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../lib/format'
import { useCart } from '../context/useCart'
import { useCommerceUI } from '../context/useCommerceUI'
import { HeritageImage } from './HeritageImage'
import { ProductVisualPlaceholder } from './ProductVisualPlaceholder'
import { Ornament } from './Ornament'

export function CartDrawer() {
  const { isCartOpen, closeCart } = useCommerceUI()
  const { items, cartCount, subtotal, updateQuantity, removeItem, isGuest } = useCart()

  useEffect(() => {
    if (!isCartOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeCart, isCartOpen])

  if (!isCartOpen) return null

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="drawer-layer__backdrop" onClick={closeCart} />
      <aside className="cart-drawer">
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2>Shopping bag <span>({cartCount})</span></h2>
          </div>
          <button type="button" className="icon-button" onClick={closeCart} aria-label="Close shopping bag">×</button>
        </div>
        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <span className="cart-drawer__empty-mark">SC</span>
            <h3>Your bag is waiting.</h3>
            <p>Begin with a piece that feels like it was made for your story.</p>
            <Link to="/store/shop" className="button button--outline" onClick={closeCart}>Explore the collection</Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div className="drawer-item" key={item.key}>
                  <Link to={`/store/product/${item.slug}`} onClick={closeCart} className="drawer-item__image">
                    {item.imageUrl ? <HeritageImage src={item.imageUrl} alt={item.name} loading="lazy" /> : <ProductVisualPlaceholder tone={item.tone} name={item.name} />}
                  </Link>
                  <div className="drawer-item__body">
                    <div className="drawer-item__topline">
                      <span className="eyebrow">{item.category}</span>
                      <button type="button" className="text-button" onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}>Remove</button>
                    </div>
                    <Link to={`/store/product/${item.slug}`} onClick={closeCart} className="drawer-item__name">{item.name}</Link>
                    <div className="drawer-item__variant">{item.selectedColor || item.selectedSize ? [item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') : 'Standard'}</div>
                    <div className="drawer-item__bottom">
                      <div className="quantity-selector quantity-selector--small">
                        <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedColor, item.selectedSize)} aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedColor, item.selectedSize)}
                          aria-label="Increase quantity"
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>
                      <strong>{formatCurrency(item.lineTotal)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-drawer__footer">
              <Ornament compact />
              <div className="cart-drawer__subtotal"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
              <p>Taxes included. Delivery is calculated at checkout.</p>
              <Link to="/store/checkout" className="button button--dark button--full" onClick={closeCart}>Proceed to checkout</Link>
              <Link to="/store/cart" className="button button--text button--full" onClick={closeCart}>View shopping bag</Link>
              {isGuest ? <p className="cart-drawer__guest-note">Your bag is saved on this device and moves to your account when you sign in.</p> : null}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
