import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { DbImage } from '../components/DbImage'
import { Reveal } from '../components/Reveal'
import { useAuth } from '../context/useAuth'
import { useWishlist } from '../context/useWishlist'
import { useMyOrder, useMyOrders } from '../hooks/useCommerce'
import { useSiteImages } from '../hooks/useEditorial'
import { formatCurrency, formatDate } from '../lib/format'
import type { OrderStatus } from '../types/api'

const progress: OrderStatus[] = ['processing', 'packed', 'shipped', 'delivered']

const statusLabel: Record<OrderStatus, string> = {
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const paymentLabel = { upi: 'UPI', card: 'Card', cod: 'Pay on delivery' } as const

export function CustomerOrdersPage() {
  const { user, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const { data: siteImages } = useSiteImages()
  const { count: wishlistCount } = useWishlist()

  // The order just placed is linked from checkout, so its detail is fetched on
  // its own rather than waiting for the list to come back.
  const placedNumber = searchParams.get('placed')
  const { data: ordersData, isLoading, error } = useMyOrders({ limit: 25 })
  const { data: placedData } = useMyOrder(placedNumber ?? undefined)

  if (!user) {
    return <Navigate to="/store/login" replace />
  }

  const customerOrders = ordersData?.orders ?? []
  const pagination = ordersData?.pagination
  const justPlaced = placedData?.order ?? null

  return (
    <div className="orders-page">
      {justPlaced ? (
        <section className="order-confirmation">
          <div className="container">
            <div className="order-confirmation__mark">✓</div>
            <div>
              <p className="eyebrow">Order {justPlaced.orderNumber} confirmed</p>
              <h1>Thank you for bringing a little beauty home.</h1>
              <p>We have sent a confirmation note to {justPlaced.shippingEmail}. Your pieces will soon be on their way.</p>
            </div>
            <Link to="/store/shop" className="button button--gold">Continue shopping <span>↗</span></Link>
          </div>
        </section>
      ) : null}

      <section className="container account-heading">
        <div>
          <p className="eyebrow">Your Shoba account</p>
          <h1>Orders & care</h1>
          <p>A quiet place to follow your pieces from our hands to yours.</p>
        </div>
        <div className="account-heading__profile">
          <span className="account-avatar">{user.initials}</span>
          <span><strong>{user.name}</strong><small>{user.email}</small></span>
          <button type="button" className="text-button" onClick={() => void signOut()}>Sign out</button>
        </div>
      </section>

      <section className="container orders-layout">
        <div className="orders-main">
          <div className="orders-main__heading">
            <h2>Recent orders</h2>
            <span>{pagination?.total ?? customerOrders.length} {(pagination?.total ?? customerOrders.length) === 1 ? 'order' : 'orders'}</span>
          </div>

          {error ? <p className="form-error" role="alert">{error instanceof Error ? error.message : 'We could not load your orders.'}</p> : null}

          {isLoading ? <p className="orders-main__loading">Gathering your orders…</p> : null}

          {!isLoading && !error && customerOrders.length === 0 ? (
            <div className="empty-page empty-page--inline">
              <div className="empty-page__mark">SC</div>
              <h2>No orders yet.</h2>
              <p>When you place an order it will appear here, with its journey from our hands to yours.</p>
              <Link to="/store/shop" className="button button--dark">Explore the collection</Link>
            </div>
          ) : null}

          {customerOrders.map((order) => {
            const activeStep = progress.indexOf(order.status)
            const isCancelled = order.status === 'cancelled'
            const isExpanded = expandedOrder === order.id

            return (
              <article className="order-card" key={order.id}>
                <div className="order-card__header">
                  <div><span className="eyebrow">{order.orderNumber}</span><h3>{formatDate(order.createdAt)}</h3></div>
                  <div>
                    <span className={`order-status order-status--${order.status}`}>{statusLabel[order.status]}</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </div>

                {isCancelled ? null : (
                  <div className="order-card__progress">
                    {progress.map((status, index) => (
                      <div className={`order-progress-step ${index <= activeStep ? 'is-complete' : ''}`} key={status}>
                        <span>{index < activeStep ? '✓' : index === activeStep ? '•' : '·'}</span>
                        <small>{statusLabel[status]}</small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-card__footer">
                  <span>{order.itemCount} {order.itemCount === 1 ? 'piece' : 'pieces'} · {order.shippingCity}</span>
                  <button type="button" className="text-button" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                    {isExpanded ? 'Hide details' : 'View details'} <span>↘</span>
                  </button>
                </div>

                {isExpanded ? (
                  <div className="order-card__details">
                    <div><span>Payment</span><strong>{paymentLabel[order.paymentMethod]} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</strong></div>
                    <div><span>Delivery</span><strong>{order.shippingMethod}{order.shippingAddress ? ` to ${order.shippingAddress}, ${order.shippingPincode}` : ''}</strong></div>
                    <div><span>Contact</span><strong>{order.shippingName} · {order.shippingPhone}</strong></div>
                    <Link to="/store" className="text-button">Need help? Contact care ↗</Link>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>

        <aside className="account-aside">
          <div className="account-aside__card">
            <p className="eyebrow">Your profile</p>
            <div className="account-aside__identity">
              <span className="account-avatar account-avatar--large">{user.initials}</span>
              <strong>{user.name}</strong>
              <span>{user.createdAt ? `Member since ${formatDate(user.createdAt)}` : 'Member'}</span>
            </div>
            <div className="account-aside__stats">
              <span><strong>{String(pagination?.total ?? 0).padStart(2, '0')}</strong><small>Orders</small></span>
              <span><strong>{String(wishlistCount).padStart(2, '0')}</strong><small>Wishlist</small></span>
            </div>
            <Link to="/store/wishlist" className="button button--outline button--full">View wishlist</Link>
            <button type="button" className="button button--text button--full" onClick={() => void signOut()}>Sign out</button>
          </div>

          <div className="account-aside__note">
            <DbImage image={siteImages?.images.palace} fallbackName="Shoba Creations" />
            <span>Need a hand?</span>
            <p>Our care team is here for fit, delivery, or gifting advice.</p>
            <a href="mailto:care@shobacreations.in">care@shobacreations.in ↗</a>
          </div>
        </aside>
      </section>

      <section className="container orders-care">
        <Reveal>
          <p className="eyebrow">The Shoba promise</p>
          <h2>From our hands<br /><em>to your home.</em></h2>
          <p>Every order is wrapped in tissue, tied with a handwritten note, and sent with the same care we give to the pieces we make.</p>
        </Reveal>
        <DbImage image={siteImages?.images.heroSecondary} fallbackName="Textile folds in a heritage studio" />
      </section>
    </div>
  )
}
