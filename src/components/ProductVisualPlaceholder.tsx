import type { ProductTone } from '../types/api'

interface ProductVisualPlaceholderProps {
  tone: ProductTone | string | null
  name: string
}

export function ProductVisualPlaceholder({ tone, name }: ProductVisualPlaceholderProps) {
  return (
    <div className={`product-visual product-visual--${tone ?? 'ivory'} product-visual--placeholder`} aria-label={name}>
      <span>{name.slice(0, 1).toUpperCase()}</span>
    </div>
  )
}
