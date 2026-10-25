import { Link } from 'react-router-dom'
import { useWishlist } from '../context/useWishlist'
import { ProductCard } from '../components/ProductCard'
import { SectionHeading } from '../components/SectionHeading'

export function WishlistPage() {
  const { products, count, isLoading, clearWishlist } = useWishlist()

  return (
    <div className="wishlist-page">
      <section className="container wishlist-heading">
        <div className="breadcrumbs"><Link to="/store">Home</Link><span>·</span><strong>Wishlist</strong></div>
        <p className="eyebrow">Kept for later</p>
        <div className="wishlist-heading__row">
          <h1>Your wishlist <small>({count})</small></h1>
          {count > 0 ? <button type="button" className="text-button" onClick={clearWishlist}>Clear wishlist</button> : null}
        </div>
        <p>Pieces that caught your eye, waiting for the right moment.</p>
      </section>

      <section className="container wishlist-content">
        {count === 0 ? (
          <div className="empty-state">
            <span className="empty-page__mark">SC</span>
            <h2>Nothing saved yet.</h2>
            <p>When a piece makes you pause, tap the heart and keep it close.</p>
            <Link to="/store/shop" className="button button--dark">Find something beautiful</Link>
          </div>
        ) : (
          <>
            <SectionHeading eyebrow="Saved for your story" title="Your considered pieces" />
            {isLoading ? (
              <p className="wishlist-content__loading">Gathering your pieces…</p>
            ) : (
              <div className="product-grid product-grid--three">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
