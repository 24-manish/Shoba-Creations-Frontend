interface QuantitySelectorProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
}

export function QuantitySelector({ value, min = 1, max, onChange }: QuantitySelectorProps) {
  return (
    <div className="quantity-selector" aria-label="Quantity selector">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease quantity">−</button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase quantity">+</button>
    </div>
  )
}
