import { useEffect, useRef, useState } from 'react'

type Direction = 'to right' | 'to bottom right' | 'to bottom'

interface Preset {
  name: string
  color1: string
  color2: string
  direction: Direction
  textColor: string
}

const PRESETS: Preset[] = [
  { name: '다크 미드나잇',      color1: '#1a1a2e', color2: '#16213e', direction: 'to bottom right', textColor: '#ffffff' },
  { name: '비비드 그라디언트',   color1: '#667eea', color2: '#f093fb', direction: 'to right',        textColor: '#ffffff' },
  { name: '파스텔 소프트',      color1: '#ffecd2', color2: '#fcb69f', direction: 'to right',        textColor: '#1c1917' },
  { name: '딥 오션',           color1: '#0f2027', color2: '#2c5364', direction: 'to bottom right', textColor: '#7dd3fc' },
  { name: '선셋 골드',         color1: '#f7971e', color2: '#ffd200', direction: 'to right',        textColor: '#1c1917' },
  { name: '포레스트 그린',      color1: '#134e5e', color2: '#71b280', direction: 'to bottom right', textColor: '#ffffff' },
]

const W = 1200
const H = 300

interface Props {
  initialTitle: string
  onApply: (dataUrl: string) => void
  onClose: () => void
}

export default function CoverImageMaker({ initialTitle, onApply, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color1, setColor1]       = useState(PRESETS[0].color1)
  const [color2, setColor2]       = useState(PRESETS[0].color2)
  const [direction, setDirection] = useState<Direction>(PRESETS[0].direction)
  const [title, setTitle]         = useState(initialTitle)
  const [subtitle, setSubtitle]   = useState('')
  const [textColor, setTextColor] = useState(PRESETS[0].textColor)
  const [quality, setQuality]     = useState(0.85)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCanvas(ctx, { color1, color2, direction, title, subtitle, textColor })
  }, [color1, color2, direction, title, subtitle, textColor])

  return (
    <>
      {/* zIndex 400: above BlogEditor (300) */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalIn 0.25s ease' }}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>커버 이미지 만들기</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>1200 × 300 px</span>
              <button type="button" onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* 바디 */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* 좌측 패널 — Task 2에서 채움 */}
            <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--c-border)', overflowY: 'auto', padding: '1rem' }}>
              <p style={{ color: 'var(--c-muted)', fontSize: '0.75rem' }}>컨트롤 패널 (Task 2)</p>
            </div>

            {/* 우측 미리보기 */}
            <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>미리보기</span>
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--c-border)', display: 'block' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', textAlign: 'center' }}>
                실제 출력: {W} × {H} · WebP {Math.round(quality * 100)}%
              </span>
              {/* 버튼 — Task 3에서 채움 */}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
                <button disabled style={{ flex: 1, padding: '0.65rem', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '10px', color: 'var(--c-muted)', fontSize: '0.85rem', cursor: 'not-allowed' }}>↓ WebP 다운로드</button>
                <button disabled style={{ flex: 1, padding: '0.65rem', background: 'var(--c-accent)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'not-allowed' }}>✓ 커버로 적용</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface DrawCanvasOpts {
  color1: string
  color2: string
  direction: Direction
  title: string
  subtitle: string
  textColor: string
}

function drawCanvas(ctx: CanvasRenderingContext2D, opts: DrawCanvasOpts) {
  const { color1, color2, direction, title, subtitle, textColor } = opts

  // 그라디언트 방향 좌표 계산
  const coords: Record<Direction, [number, number, number, number]> = {
    'to right':        [0, 0, W, 0],
    'to bottom right': [0, 0, W, H],
    'to bottom':       [0, 0, 0, H],
  }
  const [x0, y0, x1, y1] = coords[direction]
  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  grad.addColorStop(0, color1)
  grad.addColorStop(1, color2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 제목
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const titleY = subtitle.trim() ? H * 0.42 : H * 0.5
  ctx.font = `bold 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  ctx.fillText(title || '제목을 입력하세요', W / 2, titleY, W - 80)

  // 부제목
  if (subtitle.trim()) {
    ctx.globalAlpha = 0.7
    ctx.font = `28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.fillText(subtitle, W / 2, H * 0.68, W - 120)
    ctx.globalAlpha = 1
  }
}
