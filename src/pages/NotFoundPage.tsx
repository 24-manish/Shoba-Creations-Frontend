import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <div className="empty-page empty-page--not-found"><div className="empty-page__mark">404</div><p className="eyebrow">A missing page</p><h1>Let us find the way back.</h1><p>The page you are looking for seems to have wandered beyond the house.</p><Link to="/store" className="button button--dark">Return home <span>↗</span></Link></div>
}
