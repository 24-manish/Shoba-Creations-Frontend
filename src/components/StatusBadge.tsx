interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusClass = status.toLowerCase().replace(/\s+/g, '-')

  return <span className={`status-badge status-${statusClass}`}>{status}</span>
}
