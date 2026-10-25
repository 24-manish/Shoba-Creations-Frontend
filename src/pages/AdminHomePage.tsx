import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DbImage } from '../components/DbImage'
import { ProductVisualPlaceholder } from '../components/ProductVisualPlaceholder'
import { Reveal } from '../components/Reveal'
import { useAdminDashboard } from '../hooks/useAdmin'
import { useSiteImages } from '../hooks/useEditorial'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'
import type { OrderStatus } from '../types/api'

const statusLabels: Record<OrderStatus, string> = {
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

export function AdminHomePage() {
  const { data, isLoading, error } = useAdminDashboard(true)
  const { data: siteImages } = useSiteImages()

  // The chart is the server's daily revenue series, so the bars are scaled to the
  // real peak rather than to a hand-written array.
  const series = useMemo(() => data?.revenueByDay ?? [], [data])
  const chartMax = useMemo(() => Math.max(...series.map((point) => point.revenue), 1), [series])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (error) {
    return (
      <div className="admin-page admin-home-page">
        <div className="admin-page__heading"><div><p className="admin-overline">Overview</p><h1>Dashboard</h1></div></div>
        <div className="admin-panel"><p className="form-error" role="alert">We could not load the dashboard. {error instanceof Error ? error.message : ''}</p></div>
      </div>
    )
  }

  const lowStock = data?.lowStock ?? []
  const bestSellers = data?.bestSellers ?? []
  const bestSellerTotal = bestSellers.reduce((sum, item) => sum + item.unitsSold, 0)
  const bestSellerMax = Math.max(...bestSellers.map((item) => item.unitsSold), 1)

  return (
    <div className="admin-page admin-home-page">
      <div className="admin-page__heading">
        <div>
          <p className="admin-overline">{isLoading ? 'Loading…' : formatDate(new Date().toISOString())}</p>
          <h1>{greeting}.</h1>
          <p>Here is the pulse of Shoba Creations today.</p>
        </div>
        <div className="admin-page__heading-actions">
          <Link to="/admin/inventory" className="admin-button admin-button--dark">Review inventory <span>→</span></Link>
        </div>
      </div>

      <div className="admin-stat-grid">
        <Reveal>
          <article className="admin-stat-card admin-stat-card--burgundy">
            <div className="admin-stat-card__top"><span>Revenue this month</span><span className="admin-stat-card__icon">₹</span></div>
            <strong>{data ? formatCompactCurrency(data.revenueThisMonth) : '—'}</strong>
            <small><b>{data ? formatCompactCurrency(data.revenueLifetime) : '—'}</b> lifetime</small>
          </article>
        </Reveal>
        <Reveal delay={80}>
          <article className="admin-stat-card">
            <div className="admin-stat-card__top"><span>Orders this month</span><span className="admin-stat-card__icon">↗</span></div>
            <strong>{data ? data.ordersThisMonth : '—'}</strong>
            <small><b>{data ? data.totalOrders : '—'}</b> orders in total</small>
          </article>
        </Reveal>
        <Reveal delay={160}>
          <article className="admin-stat-card">
            <div className="admin-stat-card__top"><span>Average order value</span><span className="admin-stat-card__icon">◇</span></div>
            <strong>{data ? formatCurrency(data.averageOrderValue) : '—'}</strong>
            <small><b>{data?.awaitingFulfilment ?? 0}</b> awaiting fulfilment</small>
          </article>
        </Reveal>
        <Reveal delay={240}>
          <article className="admin-stat-card admin-stat-card--alert">
            <div className="admin-stat-card__top"><span>Needs attention</span><span className="admin-stat-card__icon">!</span></div>
            <strong>{lowStock.length.toString().padStart(2, '0')}</strong>
            <small><b>{lowStock.length} low stock</b> items need review</small>
            <Link to="/admin/inventory" className="admin-stat-card__link">Review inventory →</Link>
          </article>
        </Reveal>
      </div>

      <div className="admin-dashboard-grid">
        <Reveal>
          <section className="admin-panel admin-panel--sales">
            <div className="admin-panel__heading">
              <div><span>Revenue overview</span><h2>{data ? formatCompactCurrency(data.revenueThisMonth) : '—'}</h2></div>
              <span className="admin-panel__period">Last {series.length} days</span>
            </div>
            {series.length > 0 ? (
              <div className="sales-chart">
                {series.map((point) => (
                  <div className="sales-chart__column" key={point.day}>
                    <span className="sales-chart__value">{formatCompactCurrency(point.revenue)}</span>
                    <div className="sales-chart__bar" style={{ height: `${(point.revenue / chartMax) * 100}%` }} />
                    <small>{new Date(point.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-panel__empty">No revenue recorded in this window yet.</p>
            )}
            <div className="admin-panel__footer">
              <span><i className="legend-dot legend-dot--burgundy" />Revenue</span>
              <strong><i /> <span>{series.reduce((sum, point) => sum + point.orders, 0)} orders in window</span></strong>
            </div>
          </section>
        </Reveal>

        <Reveal delay={120}>
          <section className="admin-panel admin-panel--activity">
            <div className="admin-panel__heading">
              <div><span>Recent orders</span><h2>Latest movement</h2></div>
              <Link to="/admin/orders" className="admin-panel__link">View all →</Link>
            </div>
            {data?.recentOrders.length ? (
              <div className="activity-list">
                {data.recentOrders.map((order) => (
                  <Link to="/admin/orders" className="activity-row" key={order.id}>
                    <span className="activity-row__avatar">{initials(order.shippingName)}</span>
                    <span><strong>{order.shippingName}</strong><small>{order.orderNumber} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</small></span>
                    <span className="activity-row__amount">{formatCurrency(order.total)}<small>{statusLabels[order.status]}</small></span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="admin-panel__empty">No orders have been placed yet.</p>
            )}
            <div className="activity-panel__image"><DbImage image={siteImages?.images.heroSecondary} fallbackName="Shoba Creations" /><span>Curated for every ritual</span></div>
          </section>
        </Reveal>
      </div>

      <div className="admin-dashboard-grid admin-dashboard-grid--lower">
        <Reveal>
          <section className="admin-panel admin-panel--inventory">
            <div className="admin-panel__heading">
              <div><span>Inventory watch</span><h2>Stock to watch</h2></div>
              <Link to="/admin/inventory" className="admin-panel__link">Manage inventory →</Link>
            </div>
            {lowStock.length > 0 ? (
              <div className="admin-inventory-list">
                {lowStock.slice(0, 4).map((item) => (
                  <div className="admin-inventory-row" key={item.id}>
                    <ProductVisualPlaceholder tone="ivory" name={item.name} />
                    <span><strong>{item.name}</strong><small>{item.sku} · Reorder at {item.reorderPoint}</small></span>
                    <div><strong>{item.stock}</strong><small>{item.stock === 0 ? 'Out of stock' : 'Low stock'}</small></div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-panel__empty">Every active product is above its reorder point.</p>
            )}
          </section>
        </Reveal>

        <Reveal delay={120}>
          <section className="admin-panel admin-panel--collections">
            <div className="admin-panel__heading">
              <div><span>Collection notes</span><h2>House signals</h2></div>
              <span className="admin-panel__date">From live sales</span>
            </div>
            {bestSellers.length > 0 ? (
              <>
                <div className="collection-signal">
                  <div className="collection-signal__image"><DbImage image={siteImages?.images.palaceSecondary} fallbackName="The collection" /></div>
                  <div>
                    <span>Top performing piece</span>
                    <strong>{bestSellers[0].productName}</strong>
                    <p>{bestSellers[0].unitsSold} units sold · {formatCurrency(bestSellers[0].revenue)}</p>
                    {bestSellers[0].productSlug ? <Link to={`/store/product/${bestSellers[0].productSlug}`}>View storefront →</Link> : null}
                  </div>
                </div>
                <div className="collection-signal__bar">
                  {bestSellers.slice(0, 4).map((item) => (
                    <span key={item.productId}>{item.productName} <b>{Math.round((item.unitsSold / bestSellerTotal) * 100)}%</b></span>
                  ))}
                  {bestSellers.slice(0, 4).map((item) => (
                    <i key={item.productId}><b style={{ width: `${(item.unitsSold / bestSellerMax) * 100}%` }} /></i>
                  ))}
                </div>
              </>
            ) : (
              <p className="admin-panel__empty">No sales have been recorded yet, so there is nothing to rank.</p>
            )}
          </section>
        </Reveal>
      </div>

      {data?.statusCounts && Object.keys(data.statusCounts).length > 0 ? (
        <div className="admin-panel admin-panel--status">
          <div className="admin-panel__heading"><div><span>Order mix</span><h2>Where orders stand</h2></div></div>
          <div className="admin-status-bars">
            {(Object.entries(data.statusCounts) as [OrderStatus, number][]).map(([status, count]) => (
              <div key={status}>
                <span>{statusLabels[status] ?? status}</span>
                <i><b style={{ width: `${(count / Math.max(data.totalOrders, 1)) * 100}%` }} /></i>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
