import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({ title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark" aria-hidden="true">SC</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionTo && (
        <Link className="button button-primary" to={actionTo}>
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
