# Cover Image Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BlogEditor 안에 "이미지 만들기" 버튼을 추가하고, HTML Canvas API 기반의 커버 이미지 제작 모달(`CoverImageMaker`)을 구현한다. 1200×300px WebP 출력 및 커버 직접 적용 기능 포함.

**Architecture:** `CoverImageMaker.tsx` 신규 컴포넌트 하나를 생성하고, `BlogEditor.tsx`에 버튼과 모달 상태를 추가한다. Canvas API로 오프스크린 1200×300 캔버스에 그라디언트+텍스트를 렌더링하고 `toBlob('image/webp')`로 내보낸다.

**Tech Stack:** React 18, TypeScript, HTML Canvas API, Vite (빌드 확인용: `npm run build`)

---

## File Map

| 파일 | 작업 |
|------|------|
| `src/components/CoverImageMaker.tsx` | 신규 생성 — 모달 전체 (캔버스, 컨트롤, 내보내기) |
| `src/components/BlogEditor.tsx` | 수정 — "이미지 만들기" 버튼 + `showCoverMaker` 상태 추가 |

---

## Task 1: CoverImageMaker 뼈대 + 캔버스 렌더링

**Files:**
- Create: `src/components/CoverImageMaker.tsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

`src/components/CoverImageMaker.tsx`를 아래 내용으로 생성한다.

```tsx
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
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>커버 이미지 만들기</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>1200 × 300 px</span>
            <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  )
}

function drawCanvas(
  ctx: CanvasRenderingContext2D,
  opts: { color1: string; color2: string; direction: Direction; title: string; subtitle: string; textColor: string }
) {
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (또는 CoverImageMaker와 무관한 기존 에러만)

- [ ] **Step 3: 커밋**

```bash
git add src/components/CoverImageMaker.tsx
git commit -m "feat: CoverImageMaker 뼈대 + Canvas 렌더링 구현"
```

---

## Task 2: 좌측 컨트롤 패널 구현

**Files:**
- Modify: `src/components/CoverImageMaker.tsx` — 좌측 패널 placeholder를 실제 컨트롤로 교체

- [ ] **Step 1: 섹션 레이블 헬퍼 스타일 상수 추가 및 좌측 패널 교체**

`CoverImageMaker.tsx`에서 `{/* 좌측 패널 — Task 2에서 채움 */}` 블록을 아래로 교체한다:

```tsx
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
```

- [ ] **Step 2: 스타일 상수를 컴포넌트 바깥에 추가**

`export default function CoverImageMaker` 바로 위에 추가:

```tsx
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
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 개발 서버에서 시각 확인**

```bash
npm run dev
```

관리자 로그인 후 블로그 에디터 열기 → Task 3 완료 전이므로 진입점은 없음. Task 4에서 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/CoverImageMaker.tsx
git commit -m "feat: CoverImageMaker 좌측 컨트롤 패널 구현"
```

---

## Task 3: 내보내기 버튼 구현 (다운로드 + 적용)

**Files:**
- Modify: `src/components/CoverImageMaker.tsx` — disabled 버튼을 실제 동작으로 교체

- [ ] **Step 1: handleDownload 함수 추가**

`useEffect` 블록 바로 아래에 추가:

```tsx
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cover-image.webp'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/webp', quality)
  }
```

- [ ] **Step 2: handleApply 함수 추가**

`handleDownload` 바로 아래에 추가:

```tsx
  const handleApply = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/webp', quality)
    onApply(dataUrl)
    onClose()
  }
```

- [ ] **Step 3: disabled 버튼을 실제 버튼으로 교체**

우측 패널의 버튼 영역을 교체:

```tsx
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={handleDownload}
                style={{ flex: 1, padding: '0.65rem', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '10px', color: 'var(--c-text)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-display)' }}
              >
                ↓ WebP 다운로드
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={{ flex: 1, padding: '0.65rem', background: 'var(--c-accent)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}
              >
                ✓ 커버로 적용
              </button>
            </div>
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/CoverImageMaker.tsx
git commit -m "feat: CoverImageMaker WebP 다운로드 및 커버 적용 기능 구현"
```

---

## Task 4: BlogEditor 연동

**Files:**
- Modify: `src/components/BlogEditor.tsx`

- [ ] **Step 1: import 추가**

`BlogEditor.tsx` 상단 import 목록에 추가 (다른 import들 바로 아래):

```tsx
import CoverImageMaker from './CoverImageMaker'
```

- [ ] **Step 2: showCoverMaker 상태 추가**

`BlogEditor` 함수 내 기존 `useState` 선언들 바로 아래에 추가:

```tsx
  const [showCoverMaker, setShowCoverMaker] = useState(false)
```

- [ ] **Step 3: "이미지 만들기" 버튼 추가**

`BlogEditor.tsx:260` 의 커버 이미지 `<label>` 태그 바로 다음 (`</label>` 닫는 태그 뒤) 버튼을 추가한다. 현재 코드:

```tsx
              <label style={{ flexShrink: 0, width: '100px', height: '80px', ... }}>
                ...
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
```

`</label>`과 `<div style={{ display: 'flex', flexDirection: 'column'` 사이에 삽입:

```tsx
              <button
                type="button"
                onClick={() => setShowCoverMaker(true)}
                style={{ flexShrink: 0, padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-accent)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.35rem', height: '80px', flexDirection: 'column', justifyContent: 'center' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M3 9h18M9 21V9"/></svg>
                <span>이미지<br/>만들기</span>
              </button>
```

- [ ] **Step 4: CoverImageMaker 모달 렌더링 추가**

`BlogEditor` return 문 최상단 `<div onClick={onClose}` 바로 위에 추가:

```tsx
      {showCoverMaker && (
        <CoverImageMaker
          initialTitle={extractMeta(content, contentType).title}
          onApply={(dataUrl) => setCoverImage(dataUrl)}
          onClose={() => setShowCoverMaker(false)}
        />
      )}
```

- [ ] **Step 5: 타입 체크 + 빌드 확인**

```bash
npx tsc --noEmit && npm run build
```

Expected: 에러 없음, 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add src/components/BlogEditor.tsx
git commit -m "feat: BlogEditor에 커버 이미지 만들기 버튼 및 CoverImageMaker 연동"
```

---

## Task 5: 수동 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 기본 흐름 확인**

1. 브라우저에서 `/blog` 접근
2. 관리자 로그인
3. "새 글 쓰기" 클릭
4. 커버 섹션에 "이미지 만들기" 버튼 확인
5. 버튼 클릭 → CoverImageMaker 모달 열림 확인
6. 캔버스에 기본 프리셋(다크 미드나잇) + 제목 텍스트 표시 확인

- [ ] **Step 3: 프리셋 전환 확인**

6가지 프리셋 버튼 클릭 시 캔버스 색상/방향 즉시 변경 확인

- [ ] **Step 4: 컨트롤 동작 확인**

- 컬러 피커로 색1/색2 변경 → 캔버스 즉시 반영
- 방향 버튼(→ ↘ ↓) 전환 → 캔버스 즉시 반영
- 제목/부제목 입력 → 캔버스 즉시 반영
- 품질 슬라이더 → 퍼센트 수치 변경 확인

- [ ] **Step 5: 내보내기 확인**

- "↓ WebP 다운로드" 클릭 → `cover-image.webp` 파일 다운로드 확인
- 다운로드된 파일 열어서 1200×300 해상도 확인
- "✓ 커버로 적용" 클릭 → 모달 닫히고 에디터 커버 이미지 영역에 반영 확인

- [ ] **Step 6: 최종 커밋 (필요 시 수정사항 포함)**

```bash
git add -p
git commit -m "fix: CoverImageMaker 수동 검증 후 수정사항 반영"
```

수정사항 없으면 이 스텝 건너뜀.
