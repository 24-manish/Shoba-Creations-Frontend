import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { MobileMenu } from '../components/MobileMenu'
import { SearchOverlay } from '../components/SearchOverlay'
import { Ornament } from '../components/Ornament'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useCommerceUI } from '../context/useCommerceUI'
import { useWishlist } from '../context/useWishlist'

const navigation = [
  { label: 'Shop', to: '/store/shop' },
  { label: 'New arrivals', to: '/store/shop?sort=Newest' },
  { label: 'The journal', to: '/store#journal' },
  { label: 'Our story', to: '/store#story' },
]

export function StoreLayout() {
  const { user, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { openCart, openSearch, openMenu } = useCommerceUI()
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // An admin is signed in too, but has their own console; the storefront account
  // link would only bounce them back out again.
  const accountTarget = user && !isAdmin ? '/store/orders' : '/store/login'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, location.search])

  return (
    <div className="store-shell">
      <div className="announcement-bar">
        <span>Complimentary shipping on orders above ₹9,999</span>
        <span className="announcement-bar__center">The heritage edit · SS 2026</span>
        <span>Easy returns within 14 days</span>
      </div>
      <header className={`store-header ${isScrolled ? 'store-header--scrolled' : ''}`}>
        <button type="button" className="store-header__menu icon-button" onClick={openMenu} aria-label="Open navigation">☰</button>
        <Link to="/store" className="wordmark" aria-label="Shoba Creations home">
          <span>Shoba</span><em>Creations</em>
        </Link>
        <nav className="store-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink key={item.label} to={item.to} className={({ isActive }) => isActive ? 'is-active' : ''}>{item.label}</NavLink>
          ))}
        </nav>
        <div className="store-header__actions">
          <button type="button" className="header-action header-action--search" onClick={openSearch} aria-label="Search">
            <span aria-hidden="true">⌕</span><span className="header-action__label">Search</span>
          </button>
          <Link to={accountTarget} className="header-action header-action--account" aria-label={user && !isAdmin ? `My account, signed in as ${user.name}` : 'Sign in'}>
            <span aria-hidden="true">♙</span><span className="header-action__label">{user && !isAdmin ? user.name.split(' ')[0] : 'Sign in'}</span>
          </Link>
          <Link to="/store/wishlist" className="header-action header-action--count" aria-label={`Wishlist with ${wishlistCount} items`}>
            <span aria-hidden="true">♡</span><span className="header-action__count">{wishlistCount}</span>
          </Link>
          <button type="button" className="header-action header-action--count" onClick={openCart} aria-label={`Shopping bag with ${cartCount} items`}>
            <span aria-hidden="true">♧</span><span className="header-action__count">{cartCount}</span>
          </button>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="store-footer">
        <div className="store-footer__top">
          <div className="store-footer__brand">
            <Link to="/store" className="wordmark wordmark--footer"><span>Shoba</span><em>Creations</em></Link>
            <p>Quietly extraordinary pieces for the rituals that make a life.</p>
            <span className="store-footer__location">Designed in India · Made with intention</span>
          </div>
          <div className="store-footer__columns">
            <div><p className="footer-label">Explore</p><Link to="/store/shop">All pieces</Link><Link to="/store/shop?sort=Newest">New arrivals</Link><Link to="/store/wishlist">Your wishlist</Link></div>
            <div><p className="footer-label">The house</p><Link to="/store#story">Our story</Link><Link to="/store#journal">The journal</Link><Link to="/store/shop?category=Gift%20Collections">Gifting</Link></div>
            <div><p className="footer-label">Care</p><Link to="/store/orders">Track an order</Link><a href="mailto:care@shobacreations.in">Contact care</a><a href="mailto:care@shobacreations.in">Shipping & returns</a></div>
          </div>
          <div className="store-footer__newsletter">
            <p className="footer-label">A note from the house</p>
            <h3>Stories, new arrivals, and a little beauty for your inbox.</h3>
            <form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Your email address" aria-label="Email address" /><button type="submit" aria-label="Subscribe">→</button></form>
            <span>By subscribing, you agree to our privacy policy.</span>
          </div>
        </div>
        <div className="store-footer__bottom"><span>© 2026 Shoba Creations</span><Ornament compact light /><span>Made to be remembered</span></div>
      </footer>
      <CartDrawer />
      <SearchOverlay />
      <MobileMenu />
    </div>
  )
}
