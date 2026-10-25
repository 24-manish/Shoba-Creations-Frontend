interface MetricCardProps {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'positive' | 'warning'
}

export function MetricCard({ label, value, detail, tone = 'default' }: MetricCardProps) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </div>
  )
}
