import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useCommerceUI } from '../context/useCommerceUI'
import { Ornament } from './Ornament'

export function MobileMenu() {
  const { user } = useAuth()
  const { isMenuOpen, closeMenu } = useCommerceUI()

  useEffect(() => {
    if (!isMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeMenu, isMenuOpen])

  if (!isMenuOpen) return null

  return (
    <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="mobile-menu__backdrop" onClick={closeMenu} />
      <div className="mobile-menu__panel">
        <div className="mobile-menu__header">
          <span className="wordmark wordmark--small">Shoba <em>Creations</em></span>
          <button type="button" className="icon-button" onClick={closeMenu} aria-label="Close navigation">×</button>
        </div>
        <nav className="mobile-menu__nav">
          {['Shop', 'New arrivals', 'The journal', 'Our story'].map((item, index) => (
            <Link key={item} to={index === 0 ? '/store/shop' : index === 1 ? '/store/shop?sort=Newest' : index === 2 ? '/store#journal' : '/store#story'} onClick={closeMenu}>
              <span>0{index + 1}</span>{item}<b>↗</b>
            </Link>
          ))}
        </nav>
        <Link to={user ? '/store/orders' : '/store/login'} className="mobile-menu__account" onClick={closeMenu}>
          <span>{user ? 'My account' : 'Sign in'}</span><b>{user ? user.name : '→'}</b>
        </Link>
        <Ornament />
        <div className="mobile-menu__foot">
          <span>Complimentary shipping above ₹9,999</span>
          <span>Designed in India · Made with intention</span>
        </div>
      </div>
    </div>
  )
}
