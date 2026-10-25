import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { formatCurrency } from '../lib/format'
import { HeritageImage } from '../components/HeritageImage'
import { Ornament } from '../components/Ornament'
import { AdminPagination } from '../components/AdminPagination'
import { ProductVisualPlaceholder } from '../components/ProductVisualPlaceholder'
import {
  useAdminCategories,
  useAdminProducts,
  useArchiveProducts,
  useCreateProduct,
  useDeleteProductImage,
  usePurgeProducts,
  useRestoreProducts,
  useSetProductActive,
  useUpdateProduct,
  useUploadProductImages,
} from '../hooks/useAdmin'
import type { Product, ProductColorOption, ProductInput, ProductTone } from '../types/api'

const tones: ProductTone[] = ['burgundy', 'gold', 'emerald', 'ivory', 'plum', 'terracotta', 'ink']
const defaultHex = '#6d1e32'

// The catalogue is paged so one page is a focused handful of rows instead of
// an endless scroll.
const PAGE_SIZE = 8

interface ProductDraft {
  name: string
  description: string
  sku: string
  price: string
  compareAtPrice: string
  stock: string
  reorderPoint: string
  categoryId: string
  subcategory: string
  tone: ProductTone
  colorOptions: ProductColorOption[]
  sizes: string[]
  hasSizes: boolean
  isFeatured: boolean
  isNew: boolean
}

const emptyDraft: ProductDraft = {
  name: '',
  description: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  stock: '0',
  reorderPoint: '5',
  categoryId: '',
  subcategory: '',
  tone: 'burgundy',
  colorOptions: [],
  sizes: [],
  hasSizes: false,
  isFeatured: false,
  isNew: false,
}

const toDraft = (product: Product): ProductDraft => ({
  name: product.name,
  description: product.description ?? '',
  sku: product.sku,
  price: String(product.price),
  compareAtPrice: product.compareAtPrice === null ? '' : String(product.compareAtPrice),
  stock: String(product.stock),
  reorderPoint: String(product.reorderPoint),
  categoryId: product.categoryId ?? '',
  subcategory: product.subcategory ?? '',
  tone: (product.tone as ProductTone) ?? 'burgundy',
  colorOptions: product.colorOptions ?? [],
  sizes: [...product.sizes],
  hasSizes: product.sizes.length > 0,
  isFeatured: product.isFeatured,
  isNew: product.isNew,
})

interface ImagePreview {
  id: string
  src: string
  name: string
  /** Kept so the file can be uploaded once the product exists. */
  file: File
}

interface DeleteTarget {
  ids: string[]
  names: string[]
  force: boolean
}

export function AdminProductsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState(defaultHex)
  const [sizeValue, setSizeValue] = useState('')
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [draftError, setDraftError] = useState('')
  const previewsRef = useRef<ImagePreview[]>([])

  // Multi-select rows drive the bulk actions. Selection is per id, not per row,
  // so the header checkbox can select the whole loaded page and the toolbar can
  // act on something the active filters no longer show.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // The catalogue is paged so one page is a focused handful of rows instead of
  // an endless scroll. Filters restart at page one.
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [query, category, showArchived])

  const params = useMemo(
    () => ({
      search: query.trim() || undefined,
      category: category || undefined,
      includeInactive: showArchived,
      page,
      limit: PAGE_SIZE,
    }),
    [query, category, showArchived, page],
  )

  const { data, isLoading, error } = useAdminProducts(params, true)

  const totalPages = data?.pagination.totalPages ?? 0

  // Archiving or deleting rows on the last page can leave it empty; fall back
  // to the highest page that still has content instead of a blank one.
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])
  const { data: categoryData } = useAdminCategories(true)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const setActive = useSetProductActive()
  const archiveMany = useArchiveProducts()
  const restoreMany = useRestoreProducts()
  const purgeMany = usePurgeProducts()
  const uploadImages = useUploadProductImages()
  const deleteImage = useDeleteProductImage()

  useEffect(() => {
    previewsRef.current = imagePreviews
  }, [imagePreviews])

  useEffect(
    () => () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.src))
    },
    [],
  )

  const clearPreviews = () => {
    setImagePreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.src))
      return []
    })
  }

  const products = data?.items ?? []
  const categories = categoryData?.categories ?? []

  const visibleIds = products.map((product) => product.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const toggleSelection = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  // The bulk buttons are guarded by what the selection actually contains: an
  // archive makes no sense when every row is already hidden, a restore no sense
  // when every row is live.
  const selectedProducts = products.filter((product) => selected.has(product.id))
  const hasActiveSelection = selectedProducts.some((product) => product.isActive)
  const hasArchivedSelection = selectedProducts.some((product) => !product.isActive)

  const confirmArchive = () => {
    if (selected.size === 0) return
    archiveMany.mutate(Array.from(selected), {
      onSettled: () => clearSelection(),
    })
  }

  const confirmRestore = () => {
    if (selected.size === 0) return
    restoreMany.mutate(Array.from(selected), {
      onSettled: () => clearSelection(),
    })
  }

  const confirmDelete = () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    setDeleteTarget({ ids, names: products.filter((p) => ids.includes(p.id)).map((p) => p.name), force: false })
  }

  const confirmDeleteRow = (product: Product) => {
    setDeleteTarget({ ids: [product.id], names: [product.name], force: false })
  }

  const openEditor = (product?: Product) => {
    setEditing(product ?? null)
    setDraft(product ? toDraft(product) : { ...emptyDraft, categoryId: categories[0]?.id ?? '' })
    setColorName('')
    setColorHex(defaultHex)
    setSizeValue('')
    clearPreviews()
    setDraftError('')
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    clearPreviews()
    setDraftError('')
  }

  const updateDraft = <Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setDraftError('')
  }

  const addColor = () => {
    const name = colorName.trim()
    if (!name) {
      setDraftError('Add a colour name before adding it.')
      return
    }
    if (draft.colorOptions.some((option) => option.name.toLowerCase() === name.toLowerCase())) {
      setDraftError(`${name} is already in the colour list.`)
      return
    }
    updateDraft('colorOptions', [...draft.colorOptions, { name, hex: colorHex }])
    setColorName('')
  }

  const removeColor = (name: string) => {
    updateDraft('colorOptions', draft.colorOptions.filter((option) => option.name !== name))
  }

  const addSize = () => {
    const value = sizeValue.trim()
    if (!value) {
      setDraftError('Add a size before adding it.')
      return
    }
    if (draft.sizes.some((size) => size.toLowerCase() === value.toLowerCase())) {
      setDraftError(`${value} is already in the size list.`)
      return
    }
    updateDraft('sizes', [...draft.sizes, value])
    setSizeValue('')
  }

  const removeSize = (size: string) => {
    updateDraft('sizes', draft.sizes.filter((item) => item !== size))
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))
    if (files.length === 0) return

    setImagePreviews((current) => [
      ...current,
      ...files.map((file) => ({ id: `${file.name}-${file.lastModified}-${file.size}`, src: URL.createObjectURL(file), name: file.name, file })),
    ])
    event.target.value = ''
  }

  const removePreview = (id: string) => {
    setImagePreviews((current) => {
      const removed = current.find((preview) => preview.id === id)
      if (removed) URL.revokeObjectURL(removed.src)
      return current.filter((preview) => preview.id !== id)
    })
  }

  const saving = createProduct.isPending || updateProduct.isPending

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const price = Number(draft.price)
    const stock = Number(draft.stock)
    const compareAt = draft.compareAtPrice.trim() === '' ? null : Number(draft.compareAtPrice)
    const reorderPoint = Number(draft.reorderPoint)

    if (!draft.name.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setDraftError('Add a name, a price above zero, and a whole-number stock quantity.')
      return
    }
    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= price)) {
      setDraftError('A compare-at price must be higher than the price.')
      return
    }
    if (draft.hasSizes && draft.sizes.length === 0) {
      setDraftError('Add at least one size, or turn sizes off for this product.')
      return
    }

    const payload: Partial<ProductInput> = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price,
      compareAtPrice: compareAt,
      stock,
      reorderPoint: Number.isFinite(reorderPoint) && reorderPoint >= 0 ? Math.round(reorderPoint) : undefined,
      categoryId: draft.categoryId || null,
      subcategory: draft.subcategory.trim() || undefined,
      tone: draft.tone,
      colors: draft.colorOptions.map((option) => option.name),
      colorOptions: draft.colorOptions,
      sizes: draft.hasSizes ? draft.sizes : [],
      isFeatured: draft.isFeatured,
      isNew: draft.isNew,
    }

    try {
      const result = editing
        ? await updateProduct.updateProduct({ id: editing.id, payload })
        : await createProduct.createProduct(payload as ProductInput)

      // Images are uploaded after the product exists, because they are stored
      // against the generated id rather than sent with the product body.
      if (imagePreviews.length > 0) {
        await uploadImages.mutateAsync({ id: result.product.id, files: imagePreviews.map((preview) => preview.file) })
      }

      closeEditor()
    } catch (cause) {
      setDraftError(cause instanceof Error ? cause.message : 'The product could not be saved.')
    }
  }

  const onColorKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addColor()
    }
  }

  const onSizeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addSize()
    }
  }

  return (
    <div className="admin-page admin-products-page">
      <div className="admin-page__heading">
        <div><p className="admin-overline">Catalogue management</p><h1>Products</h1><p>Keep the collection considered, current, and full of character.</p></div>
        <button type="button" className="admin-button admin-button--dark" onClick={() => openEditor()}>+ Add product</button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or SKU" aria-label="Search products" /></div>
        <label className="admin-select">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="admin-select">
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived
        </label>
      </div>

      {selected.size > 0 ? (
        <div className="admin-bulk-bar">
          <span><strong>{selected.size}</strong> selected</span>
          <span className="admin-bulk-bar__actions">
            <button type="button" className="admin-button admin-button--ghost" onClick={confirmArchive} disabled={archiveMany.isPending || !hasActiveSelection}>
              {archiveMany.isPending ? 'Archiving…' : 'Archive'}
            </button>
            <button type="button" className="admin-button admin-button--ghost" onClick={confirmRestore} disabled={restoreMany.isPending || !hasArchivedSelection}>
              {restoreMany.isPending ? 'Restoring…' : 'Unarchive'}
            </button>
            <button type="button" className="admin-button admin-button--danger" onClick={confirmDelete} disabled={purgeMany.isPending}>
              Delete permanently…
            </button>
            <button type="button" className="table-action" onClick={clearSelection}>{selected.size > 1 ? 'Clear selection' : 'Clear'}</button>
          </span>
        </div>
      ) : null}

      <div className="admin-table-card">
        <div className="admin-table-card__summary">
          <span><strong>{data?.pagination.total ?? 0}</strong> products</span>
          <span>Live catalogue · saved to the database</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>
              <th className="admin-checkbox"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible products" /></th>
              <th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th>Options</th><th><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="admin-checkbox"><input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelection(product.id)} aria-label={`Select ${product.name}`} /></td>
                  <td>
                    <div className="admin-product-cell">
                      {product.images[0] ? <HeritageImage src={product.images[0].src} alt={product.images[0].alt} loading="lazy" /> : <ProductVisualPlaceholder tone={product.tone} name={product.name} />}
                      <span><strong>{product.name}</strong><small>{product.sku}{product.isActive ? '' : ' · archived'}</small></span>
                    </div>
                  </td>
                  <td>{product.category ?? product.subcategory ?? '—'}</td>
                  <td><strong>{formatCurrency(product.price)}</strong>{product.compareAtPrice ? <small className="table-muted">{product.discountLabel ?? 'Reduced'}</small> : null}</td>
                  <td><span className={`stock-pill stock-pill--${product.stock === 0 ? 'danger' : product.stock <= product.reorderPoint ? 'low' : 'good'}`}><i />{product.stock} units</span></td>
                  <td><small className="table-muted">{product.colors.length ? `${product.colors.length} colours` : 'No colours'}{product.sizes.length ? ` · ${product.sizes.length} sizes` : ''}</small></td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="table-action table-action--edit" onClick={() => openEditor(product)}><span>✎</span>Edit</button>
                      <button
                        type="button"
                        className="table-action table-action--toggle"
                        disabled={setActive.isPending}
                        onClick={() => setActive.mutate({ id: product.id, isActive: !product.isActive })}
                      >
                        <span>{product.isActive ? '⇣' : '↺'}</span>{product.isActive ? 'Archive' : 'Restore'}
                      </button>
                      <button type="button" className="table-action table-action--danger" onClick={() => confirmDeleteRow(product)}><span>×</span>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <AdminPagination page={page} totalPages={totalPages} total={data?.pagination.total ?? 0} label="products" onChange={setPage} />
      ) : null}

      {isLoading ? <p className="admin-footnote">Loading the catalogue…</p> : null}
      {error ? <p className="form-error" role="alert">{error instanceof Error ? error.message : 'The catalogue could not be loaded.'}</p> : null}
      {!isLoading && !error && products.length === 0 ? <p className="admin-footnote">No products match this view yet.</p> : null}

      {editorOpen ? (
        <div className="admin-modal-layer">
          <div className="admin-modal admin-modal--product" role="dialog" aria-modal="true" aria-labelledby="product-editor-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-modal__heading">
              <div><p className="admin-overline">{editing ? 'Refine product' : 'New catalogue piece'}</p><h2 id="product-editor-title">{editing ? 'Edit product' : 'Add product'}</h2></div>
              <button type="button" className="icon-button" onClick={closeEditor} aria-label="Close product editor">×</button>
            </div>

            <form className="admin-form admin-product-form" onSubmit={saveProduct}>
              <div className="admin-form__row">
                <label>Product name<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="e.g. Handwoven Cotton Saree" required /></label>
                <label>SKU<span className="admin-draft-sku">{editing ? draft.sku : 'Auto-generated when saved'}</span></label>
              </div>

              <label>Description<textarea rows={3} value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} placeholder="What makes this piece worth keeping?" /></label>

              <div className="admin-form__row admin-form__row--three">
                <label>
                  Category
                  <select value={draft.categoryId} onChange={(event) => updateDraft('categoryId', event.target.value)}>
                    <option value="">Uncategorised</option>
                    {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label>Subcategory<input value={draft.subcategory} onChange={(event) => updateDraft('subcategory', event.target.value)} placeholder="e.g. Designer Sarees" /></label>
                <label>Visual tone<select value={draft.tone} onChange={(event) => updateDraft('tone', event.target.value as ProductTone)}>{tones.map((tone) => <option key={tone} value={tone}>{tone[0].toUpperCase() + tone.slice(1)}</option>)}</select></label>
              </div>

              <div className="admin-form__row admin-form__row--three">
                <label>Price (₹)<input type="number" min="1" step="1" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} placeholder="12900" required /></label>
                <label>Compare at (₹)<input type="number" min="1" step="1" value={draft.compareAtPrice} onChange={(event) => updateDraft('compareAtPrice', event.target.value)} placeholder="Optional" /></label>
                <label>Stock<input type="number" min="0" step="1" value={draft.stock} onChange={(event) => updateDraft('stock', event.target.value)} required /></label>
              </div>

              <div className="admin-form__row admin-form__row--three">
                <label>Reorder point<input type="number" min="0" step="1" value={draft.reorderPoint} onChange={(event) => updateDraft('reorderPoint', event.target.value)} /></label>
                <label className="admin-toggle"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => updateDraft('isFeatured', event.target.checked)} /><i /><b>Featured on the homepage</b></label>
                <label className="admin-toggle"><input type="checkbox" checked={draft.isNew} onChange={(event) => updateDraft('isNew', event.target.checked)} /><i /><b>Mark as a new arrival</b></label>
              </div>

              <section className="admin-option-section">
                <div className="admin-option-section__heading"><div><strong>Product options</strong><span>Add as many colour and size choices as this piece needs.</span></div><span className="admin-option-badge">Dynamic</span></div>

                <div className="admin-color-builder">
                  <div className="admin-builder-heading"><span>Colours</span><small>{draft.colorOptions.length} {draft.colorOptions.length === 1 ? 'option' : 'options'}</small></div>
                  <div className="admin-builder-entry">
                    <input type="text" value={colorName} onChange={(event) => setColorName(event.target.value)} onKeyDown={onColorKeyDown} placeholder="e.g. Deep Maroon" aria-label="Colour name" />
                    <input className="admin-color-picker" type="color" value={colorHex} onChange={(event) => setColorHex(event.target.value)} aria-label="Colour swatch" />
                    <button type="button" className="admin-add-option" onClick={addColor}>+ Add</button>
                  </div>
                  {draft.colorOptions.length > 0 ? (
                    <div className="admin-option-chips">
                      {draft.colorOptions.map((option) => (
                        <span className="admin-option-chip" key={option.name}>
                          <i style={{ backgroundColor: option.hex }} />
                          <span>{option.name}</span>
                          <input type="color" value={option.hex} onChange={(event) => updateDraft('colorOptions', draft.colorOptions.map((item) => item.name === option.name ? { ...item, hex: event.target.value } : item))} aria-label={`Change ${option.name} swatch`} />
                          <button type="button" onClick={() => removeColor(option.name)} aria-label={`Remove ${option.name}`}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : <p className="admin-builder-empty">No colours added. Products can also be created without colour choices.</p>}
                </div>

                <div className="admin-size-builder">
                  <div className="admin-builder-heading">
                    <span>Sizes / lengths</span>
                    <label className="admin-toggle"><input type="checkbox" checked={draft.hasSizes} onChange={(event) => { updateDraft('hasSizes', event.target.checked); if (!event.target.checked) setSizeValue('') }} /><i /><b>{draft.hasSizes ? 'Enabled' : 'Optional'}</b></label>
                  </div>
                  {draft.hasSizes ? (
                    <>
                      <div className="admin-builder-entry admin-builder-entry--size">
                        <input type="text" value={sizeValue} onChange={(event) => setSizeValue(event.target.value)} onKeyDown={onSizeKeyDown} placeholder="e.g. 32, 5.5 m, One size" aria-label="Size value" />
                        <button type="button" className="admin-add-option" onClick={addSize}>+ Add</button>
                      </div>
                      {draft.sizes.length > 0 ? (
                        <div className="admin-option-chips admin-option-chips--sizes">
                          {draft.sizes.map((size) => <span className="admin-option-chip" key={size}><span>{size}</span><button type="button" onClick={() => removeSize(size)} aria-label={`Remove ${size}`}>×</button></span>)}
                        </div>
                      ) : <p className="admin-builder-empty">Add at least one size, or switch this option off.</p>}
                    </>
                  ) : <p className="admin-builder-empty">This product will be shown without a size selector.</p>}
                </div>
              </section>

              <section className="admin-upload-section">
                <div className="admin-option-section__heading">
                  <div><strong>Product pictures</strong><span>Images are stored on the server and shown on the storefront.</span></div>
                  <span className="admin-option-badge">{imagePreviews.length} to upload</span>
                </div>

                {editing && editing.images.length > 0 ? (
                  <div className="admin-upload-grid">
                    {editing.images.map((image, index) => (
                      <div className={`admin-upload-preview ${index === 0 ? 'is-cover' : ''}`} key={image.id}>
                        <HeritageImage src={image.src} alt={image.alt} />
                        <span>{index === 0 ? 'Cover' : `Image ${index + 1}`}</span>
                        <button
                          type="button"
                          onClick={() => deleteImage.mutate({ id: editing.id, imageId: image.id })}
                          aria-label={`Delete ${image.alt}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {imagePreviews.length > 0 ? (
                  <div className="admin-upload-grid">
                    {imagePreviews.map((preview, index) => (
                      <div className="admin-upload-preview" key={preview.id}>
                        <HeritageImage src={preview.src} alt={preview.name} />
                        <span>{index === 0 ? 'New cover' : preview.name}</span>
                        <button type="button" onClick={() => removePreview(preview.id)} aria-label={`Remove ${preview.name}`}>×</button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!editing && imagePreviews.length === 0 ? (
                  <div className="admin-upload-empty">
                    <ProductVisualPlaceholder tone={draft.tone} name={draft.name || 'New product'} />
                    <div><strong>Pictures attach when you save</strong><span>The product is created first, then your chosen images are attached to it.</span></div>
                  </div>
                ) : null}

                <label className="admin-upload-drop">
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} />
                  <span>＋</span>
                  <div><strong>Choose product images</strong><small>PNG, JPG, or WEBP · attached on save</small></div>
                  <b>Browse</b>
                </label>
              </section>

              {draftError ? <p className="auth-error" role="alert">{draftError}</p> : null}

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={closeEditor}>Cancel</button>
                <button type="submit" className="admin-button admin-button--dark" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'} <span>↗</span>
                </button>
              </div>
            </form>

            <Ornament compact />
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="admin-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !purgeMany.isPending) setDeleteTarget(null) }}>
          <div className="admin-modal admin-modal--confirm" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-modal__heading">
              <div><p className="admin-overline">Permanent action</p><h2 id="delete-confirm-title">Delete products?</h2></div>
              <button type="button" className="icon-button" onClick={() => setDeleteTarget(null)} disabled={purgeMany.isPending} aria-label="Dismiss delete confirmation">×</button>
            </div>

            <p className="admin-confirm-copy">
              Deleting removes <strong>{deleteTarget.ids.length}</strong> {deleteTarget.ids.length === 1 ? 'product' : 'products'} from the
              catalogue permanently, along with their pictures and wishlist or cart entries. This cannot be undone.
            </p>

            {deleteTarget.names.length > 0 ? (
              <ul className="admin-confirm-list">
                {deleteTarget.names.slice(0, 6).map((name) => <li key={name}>{name}</li>)}
                {deleteTarget.names.length > 6 ? <li>…and {deleteTarget.names.length - 6} more</li> : null}
              </ul>
            ) : null}

            {purgeMany.isError ? <p className="form-error" role="alert">{purgeMany.error instanceof Error ? purgeMany.error.message : 'The products could not be deleted.'}</p> : null}

            <label className="admin-confirm-force">
              <input
                type="checkbox"
                checked={deleteTarget.force}
                disabled={purgeMany.isPending}
                onChange={(event) => setDeleteTarget({ ...deleteTarget, force: event.target.checked })}
              />
              <span>Delete even though these products appear in past orders. Their order lines keep a snapshot either way.</span>
            </label>

            <div className="admin-form__actions">
              <button type="button" className="admin-button admin-button--ghost" onClick={() => setDeleteTarget(null)} disabled={purgeMany.isPending}>Cancel</button>
              <button
                type="button"
                className="admin-button admin-button--danger"
                disabled={purgeMany.isPending}
                onClick={() => purgeMany.mutate(
                  { productIds: deleteTarget.ids, force: deleteTarget.force },
                  {
                    onSuccess: () => {
                      setDeleteTarget(null)
                      clearSelection()
                    },
                    onError: () => { /* the error is shown inside the modal */ },
                  },
                )}
              >
                {purgeMany.isPending ? 'Deleting…' : `Delete ${deleteTarget.ids.length} ${deleteTarget.ids.length === 1 ? 'product' : 'products'}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
