interface OrnamentProps {
  compact?: boolean
  light?: boolean
}

export function Ornament({ compact = false, light = false }: OrnamentProps) {
  return (
    <div className={`ornament ${compact ? 'ornament--compact' : ''} ${light ? 'ornament--light' : ''}`} aria-hidden="true">
      <span className="ornament__line" />
      <span className="ornament__diamond">◆</span>
      <span className="ornament__line" />
    </div>
  )
}
