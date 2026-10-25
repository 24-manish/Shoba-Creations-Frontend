export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactCurrency(value: number) {
  if (value >= 10000000) return `₹,1${(value / 10000000).toFixed(1)} Cr`
  if (value >= 100000) return `₹,1${(value / 100000).toFixed(1)} L`
  if (value >= 1000) return `₹,1${(value / 1000).toFixed(1)}k`
  return formatCurrency(value)
}

/**
 * Order dates arrive from the database as ISO timestamps, so they are formatted
 * here rather than being string-formatted at the database. A missing or
 * unparseable value degrades to an em dash instead of `Invalid Date`.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
