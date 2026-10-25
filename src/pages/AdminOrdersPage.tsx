import { useEffect, useMemo, useState } from 'react'
import { AdminPagination } from '../components/AdminPagination'
import { DbImage } from '../components/DbImage'
import { useAdminOrder, useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdmin'
import { useSiteImages } from '../hooks/useEditorial'
import { formatCurrency, formatDate } from '../lib/format'
import type { OrderStatus } from '../types/api'

// One focused page of orders at a time, so the table never turns into a scroll.
const PAGE_SIZE = 8

const allStatuses: Array<'All' | OrderStatus> = ['All', 'processing', 'packed', 'shipped', 'delivered', 'cancelled']
const orderStatuses = allStatuses.filter((status): status is OrderStatus => status !== 'All')

const statusLabels: Record<OrderStatus, string> = {
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const paymentLabels = { upi: 'UPI', card: 'Card', cod: 'Pay on delivery' } as const

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

export function AdminOrdersPage() {
  const [status, setStatus] = useState<'All' | OrderStatus>('All')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)

  // Searching is done by the database rather than over a downloaded page, so the
  // table stays honest as the order history grows.
  const params = useMemo(
    () => ({ status: status === 'All' ? undefined : status, search: query.trim() || undefined, page, limit: PAGE_SIZE }),
    [status, query, page],
  )
  const { data, isLoading, error } = useAdminOrders(params, true)
  const { data: detail, isLoading: detailLoading } = useAdminOrder(selectedNumber ?? undefined, true)
  const updateStatus = useUpdateOrderStatus()
  const { data: siteImages } = useSiteImages()

  // A new filter restarts at the first page; a status update or deletion can
  // also shrink the history below the current page, so it falls back.
  const totalPages = data?.pagination.totalPages ?? 0

  useEffect(() => {
    setPage(1)
  }, [status, query])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])

  const orders = data?.orders ?? []
  const pagination = data?.pagination
  const order = detail?.order
  const inFulfilment = orders.filter((item) => item.status === 'processing' || item.status === 'packed').length
  const pageRevenue = orders.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="admin-page admin-orders-page">
      <div className="admin-page__heading">
        <div><p className="admin-overline">Order fulfilment</p><h1>Orders</h1><p>Every order is a promise. Keep it moving with intention.</p></div>
      </div>

      <div className="order-summary-admin">
        <div><span>Matching orders</span><strong>{pagination?.total ?? 0}</strong><small>Across this view</small></div>
        <div><span>In this view</span><strong>{inFulfilment.toString().padStart(2, '0')}</strong><small>Awaiting fulfilment</small></div>
        <div><span>Revenue in view</span><strong>{formatCurrency(pageRevenue)}</strong><small>Sum of the listed orders</small></div>
        <div><span>Delivered in view</span><strong>{orders.filter((item) => item.status === 'delivered').length.toString().padStart(2, '0')}</strong><small>On this page</small></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order number, name, email, or city" aria-label="Search orders" />
        </div>
        <div className="inventory-status-tabs">
          {allStatuses.map((option) => (
            <button
              type="button"
              key={option}
              className={status === option ? 'is-active' : ''}
              onClick={() => setStatus(option)}
            >
              {option === 'All' ? 'All' : statusLabels[option as OrderStatus]}
              <small>{option === 'All' ? (pagination?.total ?? 0) : orders.filter((item) => item.status === option).length}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-card__summary"><span><strong>{orders.length}</strong> orders shown</span>{isLoading ? <span>Loading…</span> : null}</div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--orders">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Channel</th><th>Total</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id} onClick={() => setSelectedNumber(item.orderNumber)} className="is-clickable">
                  <td><strong className="order-id">{item.orderNumber}</strong><small>{item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}</small></td>
                  <td>
                    <div className="admin-customer-cell">
                      <span>{initials(item.shippingName)}</span>
                      <strong>{item.shippingName}</strong>
                      <small>{item.shippingCity}</small>
                    </div>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td><span className="channel-pill">{item.channel === 'online_store' ? 'Online store' : 'Wholesale'}</span></td>
                  <td><strong>{formatCurrency(item.total)}</strong></td>
                  <td><span className={`order-status order-status--${item.status}`}>{statusLabels[item.status]}</span></td>
                  <td><button type="button" className="table-action" onClick={(event) => { event.stopPropagation(); setSelectedNumber(item.orderNumber) }}>Open <span>→</span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination page={page} totalPages={totalPages} total={pagination?.total ?? 0} label="orders" onChange={setPage} />

      {error ? <p className="form-error" role="alert">We could not load the orders. {error instanceof Error ? error.message : ''}</p> : null}
      {!isLoading && !error && orders.length === 0 ? <p className="admin-footnote">No orders match this view yet.</p> : null}

      {selectedNumber ? (
        <div className="admin-modal-layer">
          <div className="admin-modal admin-modal--order" role="dialog" aria-modal="true" aria-label={`Order ${selectedNumber}`}>
            <div className="admin-modal__heading">
              <div><p className="admin-overline">Order detail</p><h2>{selectedNumber}</h2></div>
              <button type="button" className="icon-button" onClick={() => setSelectedNumber(null)} aria-label="Close order detail">×</button>
            </div>

            {detailLoading || !order ? (
              <p className="admin-modal__loading">Loading the order…</p>
            ) : (
              <>
                <div className="order-detail-hero">
                  <span className="account-avatar account-avatar--large">{initials(order.shippingName)}</span>
                  <div>
                    <strong>{order.shippingName}</strong>
                    <span>{order.shippingEmail}</span>
                    <small>{order.shippingAddress}, {order.shippingCity} {order.shippingPincode} · {formatDate(order.createdAt)}</small>
                  </div>
                  <DbImage image={siteImages?.images.heroSecondary} fallbackName="Shoba Creations" />
                </div>

                <div className="order-detail-items">
                  {order.items.map((line) => (
                    <div key={line.id} className="order-detail-item">
                      <span><strong>{line.productName}</strong><small>{[line.selectedColor, line.selectedSize].filter(Boolean).join(' · ') || 'Standard'} · {line.sku ?? '—'}</small></span>
                      <span>{line.quantity} × {formatCurrency(line.unitPrice)}</span>
                      <strong>{formatCurrency(line.lineTotal)}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-detail-grid">
                  <div><span>Items</span><strong>{order.itemCount} pieces</strong></div>
                  <div><span>Delivery</span><strong>{order.shippingMethod}</strong></div>
                  <div><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div>
                  <div><span>Shipping</span><strong>{order.shippingCost === 0 ? 'Complimentary' : formatCurrency(order.shippingCost)}</strong></div>
                  {order.handlingFee > 0 ? <div><span>Handling</span><strong>{formatCurrency(order.handlingFee)}</strong></div> : null}
                  <div><span>Total</span><strong>{formatCurrency(order.total)}</strong></div>
                  <div><span>Payment</span><strong>{paymentLabels[order.paymentMethod]} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</strong></div>
                  <div><span>Status</span><strong>{statusLabels[order.status]}</strong></div>
                </div>

                {order.note ? <p className="order-detail-note"><span>Customer note</span>{order.note}</p> : null}

                <label className="admin-status-select">
                  Fulfilment status
                  <select
                    value={order.status}
                    disabled={updateStatus.isPending}
                    onChange={(event) => updateStatus.mutate({ orderNumber: order.orderNumber, status: event.target.value as OrderStatus })}
                  >
                    {orderStatuses.map((option) => (
                      <option key={option} value={option} disabled={option !== order.status && !detail?.availableTransitions?.includes(option)}>
                        {statusLabels[option]}
                      </option>
                    ))}
                  </select>
                </label>
                {updateStatus.isError ? <p className="form-error" role="alert">{updateStatus.error instanceof Error ? updateStatus.error.message : 'The status could not be changed.'}</p> : null}

                <div className="admin-modal__actions">
                  <button type="button" className="admin-button admin-button--ghost" onClick={() => setSelectedNumber(null)}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
