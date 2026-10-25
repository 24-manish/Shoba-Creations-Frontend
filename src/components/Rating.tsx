interface RatingProps {
  rating: number
  reviewCount?: number
  compact?: boolean
}

export function Rating({ rating, reviewCount, compact = false }: RatingProps) {
  return (
    <div className={`rating ${compact ? 'rating--compact' : ''}`} aria-label={`${rating} out of 5 stars${reviewCount ? ` from ${reviewCount} reviews` : ''}`}>
      <span className="rating__stars" aria-hidden="true">★★★★★</span>
      <span className="rating__number">{rating.toFixed(1)}</span>
      {reviewCount !== undefined ? <span className="rating__count">({reviewCount})</span> : null}
    </div>
  )
}
