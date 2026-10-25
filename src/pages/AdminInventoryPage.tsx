import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPagination } from '../components/AdminPagination'
import { ProductVisualPlaceholder } from '../components/ProductVisualPlaceholder'
import { useAdminLowStock, useAdminProducts, useUpdateProduct } from '../hooks/useAdmin'
import type { Product } from '../types/api'

type StockStatus = 'All' | 'In stock' | 'Low stock' | 'Out of stock'

const statusOptions: StockStatus[] = ['All', 'In stock', 'Low stock', 'Out of stock']

// Matching the catalogue pages, one focused page of rows instead of a long scroll.
const PAGE_SIZE = 8

/** The server owns the reorder point, so the status is derived from it. */
const stockStatus = (product: Pick<Product, 'stock' | 'reorderPoint'>): StockStatus =>
  product.stock === 0 ? 'Out of stock' : product.stock <= product.reorderPoint ? 'Low stock' : 'In stock'

export function AdminInventoryPage() {
  // The full product list carries stock and reorder points; the low-stock
  // endpoint is a ready-made watch list. The page size is the API maximum, so a
  // larger catalogue would be paged rather than rejected by validation.
  const { data: productData, isLoading } = useAdminProducts({ includeInactive: true, limit: 100 }, true)
  const { data: lowStockData } = useAdminLowStock(true)
  const updateProduct = useUpdateProduct()

  const [status, setStatus] = useState<StockStatus>('All')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setPage(1)
  }, [status, query])

  const products = useMemo(() => productData?.items ?? [], [productData])

  const inventory = useMemo(
    () =>
      products.map((product) => ({
        product,
        status: stockStatus(product),
      })),
    [products],
  )

  const filteredInventory = useMemo(
    () =>
      inventory.filter((item) => {
        const matchesStatus = status === 'All' || item.status === status
        const normalized = query.trim().toLowerCase()
        const matchesQuery = !normalized || `${item.product.name} ${item.product.sku}`.toLowerCase().includes(normalized)
        return matchesStatus && matchesQuery
      }),
    [inventory, query, status],
  )

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE))

  // Editing stock can drop a row out of the current view, which may push the
  // page past the last one; fall back to the highest page that still has rows.
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const currentPage = Math.min(page, totalPages)
  const pagedInventory = filteredInventory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const saveStock = (product: Product) => {
    const parsed = Number(draft)
    if (!Number.isFinite(parsed) || parsed < 0) return

    updateProduct.mutateAsync({ id: product.id, payload: { stock: Math.round(parsed) } }).finally(() => {
      setEditingId(null)
      setDraft('')
    })
  }

  const totalUnits = inventory.reduce((sum, item) => sum + item.product.stock, 0)
  const countOf = (value: StockStatus) => inventory.filter((item) => item.status === value).length

  return (
    <div className="admin-page admin-inventory-page">
      <div className="admin-page__heading">
        <div><p className="admin-overline">Stock control</p><h1>Inventory</h1><p>Keep every shelf, studio, and ritual supplied with care.</p></div>
        <button type="button" className="admin-button admin-button--dark" onClick={() => setStatus('Low stock')}>Review alerts <span>→</span></button>
      </div>

      <div className="inventory-summary">
        <div><span>Total units</span><strong>{totalUnits}</strong><small>Across {inventory.length} SKUs</small></div>
        <div className="inventory-summary__good"><span>Healthy stock</span><strong>{countOf('In stock')}</strong><small>Ready to ship</small></div>
        <div className="inventory-summary__warn"><span>Low stock</span><strong>{countOf('Low stock')}</strong><small>Review reorder points</small></div>
        <div className="inventory-summary__danger"><span>Out of stock</span><strong>{countOf('Out of stock')}</strong><small>Needs action</small></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory" aria-label="Search inventory" /></div>
        <div className="inventory-status-tabs">
          {statusOptions.map((option) => (
            <button type="button" key={option} className={status === option ? 'is-active' : ''} onClick={() => setStatus(option)}>
              {option}<small>{option === 'All' ? inventory.length : countOf(option)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-card__summary"><span><strong>{filteredInventory.length}</strong> stock records</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Available units</th><th>Reorder point</th><th>Health</th><th><span className="sr-only">Adjust</span></th></tr></thead>
            <tbody>
              {pagedInventory.map(({ product, status: itemStatus }) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-cell">
                      <ProductVisualPlaceholder tone={product.tone} name={product.name} />
                      <span><strong>{product.name}</strong><small>{product.isActive ? 'Active' : 'Archived'}</small></span>
                    </div>
                  </td>
                  <td><code>{product.sku}</code></td>
                  <td>
                    {editingId === product.id ? (
                      <div className="stock-edit">
                        <input type="number" min={0} value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
                        <button type="button" onClick={() => saveStock(product)}>Save</button>
                      </div>
                    ) : (
                      <strong className="stock-number">{product.stock}</strong>
                    )}
                  </td>
                  <td>{product.reorderPoint} units</td>
                  <td><span className={`stock-pill stock-pill--${itemStatus === 'In stock' ? 'good' : itemStatus === 'Low stock' ? 'low' : 'danger'}`}><i />{itemStatus}</span></td>
                  <td><button type="button" className="table-action" onClick={() => { setEditingId(product.id); setDraft(String(product.stock)) }}>Adjust <span>→</span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination page={currentPage} totalPages={totalPages} total={filteredInventory.length} label="stock records" onChange={setPage} />

      {isLoading ? <p className="admin-footnote">Loading stock levels…</p> : null}

      <div className="admin-footnote">
        <span>Stock levels are saved to the database and update the storefront immediately.</span>
        <span>{lowStockData?.products.length ?? 0} products are at or below their reorder point.</span>
        <Link to="/admin/products">Manage catalogue →</Link>
      </div>
    </div>
  )
}
