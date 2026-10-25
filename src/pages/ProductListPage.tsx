import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { Ornament } from '../components/Ornament'
import { useCategories, useProducts } from '../hooks/useCatalog'
import type { ProductListParams, SortOption } from '../types/api'

/** The labels are what the storefront links carry; each maps to server bounds. */
const priceOptions = [
  { label: 'All prices', value: 'all', min: undefined, max: undefined },
  { label: 'Under ₹5,000', value: 'under-5000', min: undefined, max: 4999 },
  { label: '₹5,000 – ₹10,000', value: '5000-10000', min: 5000, max: 10000 },
  { label: 'Above ₹10,000', value: 'over-10000', min: 10001, max: undefined },
] as const

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price Low to High', value: 'price_asc' },
  { label: 'Price High to Low', value: 'price_desc' },
]

const sortLabels: Record<string, string> = {
  Featured: 'featured',
  Newest: 'newest',
  'Price Low to High': 'price_asc',
  'Price High to Low': 'price_desc',
}

export function ProductListPage() {
  const { category: categoryParam } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: categoryData } = useCategories()
  const categories = useMemo(() => categoryData?.categories ?? [], [categoryData])

  const routeCategory = categoryParam ? decodeURIComponent(categoryParam) : null
  const selectedCategory = routeCategory ?? searchParams.get('category') ?? ''
  const searchQuery = searchParams.get('search') ?? ''
  const sort = sortLabels[searchParams.get('sort') ?? ''] ?? 'featured'
  const priceRange = priceOptions.find((option) => option.value === (searchParams.get('price') ?? 'all')) ?? priceOptions[0]
  const inStockOnly = searchParams.get('inStock') === '1'
  const page = Number(searchParams.get('page') ?? '1') || 1

  // Filtering, sorting and paging all happen in the database, so a large
  // catalogue does not have to be shipped to the browser to be narrowed down.
  const params = useMemo<ProductListParams>(
    () => ({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
      sort: sort as SortOption,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      inStock: inStockOnly || undefined,
      page,
      limit: 24,
    }),
    [selectedCategory, searchQuery, sort, priceRange, inStockOnly, page],
  )

  const { data, isLoading, isFetching, error } = useProducts(params)
  const products = data?.items ?? []
  const pagination = data?.pagination

  useEffect(() => {
    document.body.classList.toggle('filters-open', filtersOpen)
    return () => document.body.classList.remove('filters-open')
  }, [filtersOpen])

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value === null || value === '' || value === 'all') next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams(searchQuery ? { search: searchQuery } : {})
    setFiltersOpen(false)
  }

  const activeCategoryName =
    categories.find((category) => category.slug === selectedCategory || category.name === selectedCategory)?.name ?? selectedCategory

  const heading = searchQuery
    ? `Results for “${searchQuery}”`
    : activeCategoryName
      ? activeCategoryName
      : 'Shop the collection'

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="container">
          <p className="eyebrow">The Shoba collection</p>
          <h1>{heading}</h1>
          <p>Quietly expressive pieces for every ritual, gathered with care.</p>
          <div className="breadcrumbs"><Link to="/store">Home</Link><span>·</span><span>Shop</span>{activeCategoryName ? <><span>·</span><span>{activeCategoryName}</span></> : null}</div>
        </div>
      </section>

      <section className="container catalog-layout">
        <aside className={`filter-sidebar ${filtersOpen ? 'is-open' : ''}`}>
          <div className="filter-sidebar__mobile-head">
            <span>Filter pieces</span>
            <button type="button" className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">×</button>
          </div>
          <div className="filter-sidebar__head">
            <span>Filter by</span>
            <button type="button" className="text-button" onClick={clearFilters}>Clear all</button>
          </div>

          <div className="filter-group">
            <span className="filter-group__label">Category</span>
            <label className="filter-option">
              <input type="radio" name="category" checked={selectedCategory === ''} onChange={() => setParam('category', null)} />
              <span className="filter-option__check" />All<small>{pagination ? '·' : ''}</small>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="filter-option">
                <input type="radio" name="category" checked={selectedCategory === category.slug || selectedCategory === category.name} onChange={() => setParam('category', category.slug)} />
                <span className="filter-option__check" />{category.name}<small>{category.productCount}</small>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-group__label">Price</span>
            {priceOptions.map((option) => (
              <label key={option.value} className="filter-option">
                <input type="radio" name="price" checked={priceRange.value === option.value} onChange={() => setParam('price', option.value === 'all' ? null : option.value)} />
                <span className="filter-option__check" />{option.label}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-group__label">Availability</span>
            <label className="filter-option">
              <input type="checkbox" checked={inStockOnly} onChange={(event) => setParam('inStock', event.target.checked ? '1' : null)} />
              <span className="filter-option__check" />In stock only
            </label>
          </div>

          <div className="filter-sidebar__note">
            <Ornament compact />
            <p>Every piece is selected in small batches. Some quantities are intentionally limited.</p>
          </div>
        </aside>

        <div className="catalog-results">
          <div className="catalog-toolbar">
            <span>
              <strong>{pagination?.total ?? 0}</strong> pieces
              {isFetching && !isLoading ? <em className="catalog-toolbar__updating">Updating…</em> : null}
            </span>
            <div className="catalog-toolbar__actions">
              <button type="button" className="filter-toggle" onClick={() => setFiltersOpen(true)}>☷ Filters</button>
              <label className="sort-select">
                Sort by
                <select value={sort} onChange={(event) => setParam('sort', event.target.value)}>
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {searchQuery ? <div className="active-search">Showing results for <strong>“{searchQuery}”</strong> <Link to="/store/shop">Clear</Link></div> : null}

          {error ? (
            <div className="empty-state"><span>SC</span><h2>We could not load the collection.</h2><p>{error instanceof Error ? error.message : 'Please try again in a moment.'}</p></div>
          ) : null}

          {!error && products.length > 0 ? (
            <div className={`product-grid product-grid--three ${isFetching ? 'is-refreshing' : ''}`}>
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : null}

          {!error && !isLoading && products.length === 0 ? (
            <div className="empty-state">
              <span>SC</span>
              <h2>Nothing quite here yet.</h2>
              <p>Try another category or loosen your filters. The right piece may be one click away.</p>
              <button type="button" className="button button--outline" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : null}

          {isLoading ? <p className="catalog-results__loading">Gathering the collection…</p> : null}

          {pagination && pagination.total > (pagination.limit ?? 24) ? (
            <nav className="pagination" aria-label="Catalogue pages">
              <button type="button" className="text-button" disabled={pagination.page <= 1} onClick={() => setParam('page', String(pagination.page - 1))}>← Previous</button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" className="text-button" disabled={pagination.page >= pagination.totalPages} onClick={() => setParam('page', String(pagination.page + 1))}>Next →</button>
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  )
}
