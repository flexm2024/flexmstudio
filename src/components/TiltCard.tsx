import { useRef, type ReactNode, type CSSProperties } from 'react'

interface Props {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export default function TiltCard({ children, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current!
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(12px) scale(1.02)`
    // shine
    const shine = el.querySelector<HTMLDivElement>('.tilt-shine')
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
    }
  }

  const onLeave = () => {
    const el = ref.current!
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0) scale(1)'
    const shine = el.querySelector<HTMLDivElement>('.tilt-shine')
    if (shine) shine.style.background = 'transparent'
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform 0.18s ease', willChange: 'transform', ...style }}
    >
      <div className="tilt-shine" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 1, transition: 'background 0.2s' }} />
      {children}
    </div>
  )
}
