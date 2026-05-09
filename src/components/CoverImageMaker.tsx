import React, { useEffect, useRef, useState } from 'react'

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

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase',
  letterSpacing: '0.07em', fontFamily: 'var(--font-display)', marginBottom: '0.4rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.35rem 0.6rem', borderRadius: '7px',
  background: 'var(--c-surface2)', border: '1px solid var(--c-border)',
  color: 'var(--c-text)', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
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
            {/* 좌측 패널 */}
          <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--c-border)', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* 프리셋 템플릿 */}
            <div>
              <p style={labelStyle}>프리셋 템플릿</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() => { setColor1(p.color1); setColor2(p.color2); setDirection(p.direction); setTextColor(p.textColor) }}
                    style={{ height: '34px', background: `linear-gradient(${p.direction}, ${p.color1}, ${p.color2})`, borderRadius: '6px', border: color1 === p.color1 && color2 === p.color2 ? '2px solid var(--c-accent)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.65rem', color: p.textColor, fontFamily: 'var(--font-display)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: 0 }} />

            {/* 배경 색상 */}
            <div>
              <p style={labelStyle}>배경 색상</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="color" value={color1} onChange={e => setColor1(e.target.value)} style={{ width: '32px', height: '24px', border: '1px solid var(--c-border)', borderRadius: '4px', cursor: 'pointer', padding: '1px' }} />
                  <input value={color1} onChange={e => setColor1(e.target.value)} maxLength={7} style={inputStyle} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>색 1</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="color" value={color2} onChange={e => setColor2(e.target.value)} style={{ width: '32px', height: '24px', border: '1px solid var(--c-border)', borderRadius: '4px', cursor: 'pointer', padding: '1px' }} />
                  <input value={color2} onChange={e => setColor2(e.target.value)} maxLength={7} style={inputStyle} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>색 2</span>
                </div>
              </div>
              <p style={{ ...labelStyle, marginTop: '0.6rem' }}>방향</p>
              <div style={{ display: 'flex', gap: '4px' }}>
                {([['to right', '→'], ['to bottom right', '↘'], ['to bottom', '↓']] as [Direction, string][]).map(([d, icon]) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    style={{ flex: 1, height: '26px', background: direction === d ? 'var(--c-accent)' : 'var(--c-surface2)', border: `1px solid ${direction === d ? 'var(--c-accent)' : 'var(--c-border)'}`, borderRadius: '6px', cursor: 'pointer', color: direction === d ? '#fff' : 'var(--c-muted)', fontSize: '0.85rem' }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: 0 }} />

            {/* 텍스트 */}
            <div>
              <p style={labelStyle}>텍스트</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>제목</span>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" style={{ ...inputStyle, marginTop: '0.2rem' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>부제목</span>
                  <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="(선택 사항)" style={{ ...inputStyle, marginTop: '0.2rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ width: '32px', height: '24px', border: '1px solid var(--c-border)', borderRadius: '4px', cursor: 'pointer', padding: '1px' }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>텍스트 색상</span>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: 0 }} />

            {/* WebP 품질 */}
            <div>
              <p style={labelStyle}>WebP 품질</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input type="range" min={0.5} max={1} step={0.05} value={quality} onChange={e => setQuality(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text)', fontFamily: 'var(--font-mono)', minWidth: '2.8rem', textAlign: 'right' }}>{Math.round(quality * 100)}%</span>
              </div>
            </div>

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
