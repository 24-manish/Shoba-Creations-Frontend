import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../lib/format'
import { useCommerceUI } from '../context/useCommerceUI'
import { useProducts } from '../hooks/useCatalog'
import { useSiteImages } from '../hooks/useEditorial'
import { DbImage } from './DbImage'
import { HeritageImage } from './HeritageImage'
import { ProductVisualPlaceholder } from './ProductVisualPlaceholder'
import { Ornament } from './Ornament'

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useCommerceUI()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { data: siteImages } = useSiteImages()

  const normalizedQuery = query.trim()
  // An empty box previews the featured rail; a typed one asks the database, so a
  // long search term is not matched in the browser against a partial catalogue.
  const { data: searchData, isFetching } = useProducts(
    normalizedQuery ? { search: normalizedQuery, limit: 6 } : { isFeatured: true, limit: 4 },
    { enabled: isSearchOpen },
  )

  if (!isSearchOpen) return null

  const results = searchData?.items ?? []
  const resultCount = searchData?.pagination.total ?? results.length

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    closeSearch()
    navigate(`/store/shop${normalizedQuery ? `?search=${encodeURIComponent(normalizedQuery)}` : ''}`)
  }

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search Shoba Creations">
      <div className="search-overlay__backdrop" onClick={closeSearch} />
      <div className="search-overlay__panel">
        <div className="search-overlay__topline">
          <span className="wordmark wordmark--small">Shoba <em>Creations</em></span>
          <button type="button" className="icon-button" onClick={closeSearch} aria-label="Close search">×</button>
        </div>

        <div className="search-overlay__intro">
          <p className="eyebrow">Find your piece</p>
          <h2>Search the house</h2>
          <Ornament />
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “saree”, “bridal”, or “gifting”"
            aria-label="Search products"
          />
          <button type="submit" className="button button--dark">Search</button>
        </form>

        <div className="search-overlay__results">
          <div className="search-overlay__result-heading">
            <span>{normalizedQuery ? `${resultCount} matching pieces` : 'Most loved this season'}{isFetching ? ' ·' : ''}</span>
            <Link to="/store/shop" onClick={closeSearch}>View all →</Link>
          </div>

          {results.length > 0 ? (
            <div className="search-overlay__grid">
              {results.map((product) => (
                <Link key={product.id} to={`/store/product/${product.slug}`} className="search-result" onClick={closeSearch}>
                  {product.images[0]
                    ? <HeritageImage src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
                    : <ProductVisualPlaceholder tone={product.tone} name={product.name} />}
                  <span>
                    <small>{product.subcategory ?? product.category}</small>
                    <strong>{product.name}</strong>
                    <em>{formatCurrency(product.price)}</em>
                  </span>
                </Link>
              ))}
            </div>
          ) : normalizedQuery && !isFetching ? (
            <p className="search-overlay__empty">Nothing matched “{normalizedQuery}”. Try a broader word.</p>
          ) : null}
        </div>

        <div className="search-overlay__footer">
          <DbImage image={siteImages?.images.palace} fallbackName="Shoba Creations" />
          <span>Every piece has a story worth keeping.</span>
        </div>
      </div>
    </div>
  )
}
