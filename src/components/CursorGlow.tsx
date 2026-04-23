import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current!
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`
      el.style.top  = `${e.clientY}px`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,138,255,0.09) 0%, transparent 70%)',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
        zIndex: 1,
        transition: 'left 0.08s ease, top 0.08s ease',
        top: '-300px', left: '-300px',
      }}
    />
  )
}
