import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { DbImage } from '../components/DbImage'
import { useAuth } from '../context/useAuth'
import { useSiteImages } from '../hooks/useEditorial'

const adminNavigation = [
  { label: 'Overview', to: '/admin', end: true },
  { label: 'Products', to: '/admin/products' },
  { label: 'Inventory', to: '/admin/inventory' },
  { label: 'Orders', to: '/admin/orders' },
]

const navIcons: Record<string, string> = {
  Overview: '◈',
  Products: '▦',
  Inventory: '◌',
  Orders: '↗',
}

export function AdminLayout() {
  const { user, signOut } = useAuth()
  const { data: siteImages } = useSiteImages()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand"><span className="admin-brand__mark">SC</span><span><strong>Shoba</strong><em>Creations</em></span></Link>
        <div className="admin-sidebar__workspace"><span>Workspace</span><strong>Warehouse desk</strong><small>Live storefront</small></div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <span className="admin-nav__label">Manage</span>
          {adminNavigation.map((item) => <NavLink key={item.label} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'is-active' : ''}><span className="admin-nav__icon">{navIcons[item.label]}</span>{item.label}</NavLink>)}
          <span className="admin-nav__label admin-nav__label--second">Quick links</span>
          <Link to="/store" className="admin-nav__link"><span className="admin-nav__icon">⌂</span>View storefront</Link>
        </nav>
        <div className="admin-sidebar__footer"><DbImage image={siteImages?.images.palace} fallbackName="Shoba Creations" /><span>Keep the details<br /><em>rich.</em></span></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Shoba Creations</span><b>/</b><strong>Warehouse desk</strong></div>
          <div className="admin-topbar__actions">
            <span className="admin-status"><i />All systems calm</span>
            <button type="button" className="admin-notification" aria-label="Notifications">♢<i /></button>
            <button type="button" className="admin-account-button" onClick={handleLogout} aria-label="Sign out of admin workspace">
              <span className="admin-avatar">{user?.initials ?? 'SC'}</span>
              <span><strong>{user?.name ?? 'Admin'}</strong><small>Sign out</small></span>
              <i aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
