interface AdminPaginationProps {
  page: number
  totalPages: number
  total: number
  label?: string
  onChange: (page: number) => void
}

/** Prev/next arrows plus a compact number window with ellipses. */
export function AdminPagination({ page, totalPages, total, label = 'items', onChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null

  const pageItems: Array<number | '…'> = []
  { const candidates = new Set([1, totalPages, page - 1, page, page + 1])
    let previous = 0
    for (const p of Array.from(candidates).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)) {
      if (p - previous > 1) pageItems.push('…')
      pageItems.push(p)
      previous = p
    }
  }

  return (
    <nav className="admin-pagination" aria-label="Page navigation">
      <span className="admin-pagination__info">Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {total} {label}</span>
      <div className="admin-pagination__controls">
        <button type="button" className="admin-pagination__arrow" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page">←</button>
        {pageItems.map((item, index) =>
          item === '…' ? (
            <span className="admin-pagination__ellipsis" key={`gap${index}`}>…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`admin-pagination__page${item === page ? ' is-current' : ''}`}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
        <button type="button" className="admin-pagination__arrow" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} aria-label="Next page">→</button>
      </div>
    </nav>
  )
}