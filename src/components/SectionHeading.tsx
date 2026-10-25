import { Ornament } from './Ornament'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  copy?: string
  align?: 'left' | 'center'
  light?: boolean
}

export function SectionHeading({ eyebrow, title, copy, align = 'left', light = false }: SectionHeadingProps) {
  return (
    <div className={`section-heading section-heading--${align} ${light ? 'section-heading--light' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <p className="section-heading__copy">{copy}</p> : null}
      {align === 'center' ? <Ornament light={light} /> : null}
    </div>
  )
}
