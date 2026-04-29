# HDKD 가구 랜딩 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** flexmstudio.com/hdkd 경로에 가구회사 리뉴얼 샘플 랜딩 페이지를 추가한다.

**Architecture:** `src/pages/HdkdLanding.tsx` 단일 파일에 모든 섹션을 구현하고, `App.tsx`에 `/hdkd` 라우트를 추가한다. NukkiAI 페이지와 동일하게 Layout 래퍼 없이 독립 페이지로 구성한다.

**Tech Stack:** React 18 + TypeScript, motion/react (Framer Motion), lucide-react, Tailwind CSS v4, Web3Forms

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `src/pages/HdkdLanding.tsx` | 신규 생성 — 랜딩 페이지 전체 |
| `src/App.tsx` | 수정 — `/hdkd` 라우트 추가 |

---

## Task 1: App.tsx에 라우트 추가

**Files:**
- Modify: `src/App.tsx:12,28`

- [ ] **Step 1: import 추가 및 라우트 등록**

`src/App.tsx`를 아래와 같이 수정한다:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AdminProvider } from './context/AdminContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Portfolio from './pages/Portfolio'
import Resources from './pages/Resources'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import NukkiAI from './pages/NukkiAI'
import HdkdLanding from './pages/HdkdLanding'

export default function App() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"            element={<Home />} />
              <Route path="/about"       element={<About />} />
              <Route path="/portfolio"   element={<Portfolio />} />
              <Route path="/resources"   element={<Resources />} />
              <Route path="/contact"     element={<Contact />} />
              <Route path="/blog"        element={<Blog />} />
              <Route path="/blog/:slug"  element={<BlogPost />} />
              <Route path="/nukki-ai"    element={<NukkiAI />} />
            </Route>
            <Route path="/hdkd" element={<HdkdLanding />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: 개발 서버 실행 확인**

```bash
cd C:\claudecode\portfolio
npm run dev
```

브라우저에서 `http://localhost:5173/hdkd` 접근 시 빈 페이지 또는 에러 없이 로드되면 OK.

- [ ] **Step 3: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: add /hdkd route for furniture landing page"
```

---

## Task 2: HdkdLanding.tsx — 골격 + 헤더

**Files:**
- Create: `src/pages/HdkdLanding.tsx`

- [ ] **Step 1: 파일 생성 — 골격 + 헤더 섹션**

`src/pages/HdkdLanding.tsx` 파일을 새로 만든다:

```tsx
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { motion, useInView } from 'motion/react'
import {
  Armchair, Leaf, Wrench, Star, Phone, MapPin, Instagram,
  ChevronDown, Send, CheckCircle,
} from 'lucide-react'

/* ── 색상 상수 ─────────────────────────────────────────────── */
const C = {
  bg:      '#FAFAF8',
  surface: '#FFFFFF',
  border:  'rgba(139,111,71,0.15)',
  wood:    '#8B6F47',
  woodLight: '#C4A882',
  text:    '#1A1A1A',
  muted:   '#6B6B6B',
  beige:   '#F5EFE6',
}

/* ── 제품 더미 데이터 ──────────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: '원목 소파', desc: '천연 원목 프레임 + 고밀도 폼', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' },
  { id: 2, name: '원목 식탁', desc: '6인 가족을 위한 넉넉한 크기', img: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&q=80' },
  { id: 3, name: '원목 침대', desc: '튼튼한 자작나무 슬랫 구조', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80' },
  { id: 4, name: '수납장', desc: '넓은 수납 공간과 부드러운 개폐감', img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80' },
  { id: 5, name: '원목 의자', desc: '인체공학적 설계로 장시간 편안함', img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80' },
  { id: 6, name: '원목 책상', desc: '집중을 돕는 깔끔한 디자인', img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80' },
]

/* ── useCountUp 훅 ─────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return { count, ref }
}

/* ── 메인 컴포넌트 ─────────────────────────────────────────── */
export default function HdkdLanding() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Pretendard, sans-serif', overflowX: 'hidden' }}>

      {/* ══ 헤더 ══ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px',
        background: scrolled ? 'rgba(250,250,248,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(1rem, 5vw, 4rem)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: C.wood, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Armchair size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>HDKD</span>
          <span style={{ fontSize: '0.7rem', color: C.muted, marginLeft: '2px' }}>가구</span>
        </div>

        {/* 데스크탑 네비 */}
        <nav style={{ display: 'flex', gap: '2rem' }} className="hidden md:flex">
          {[
            { label: '제품', id: 'products' },
            { label: '회사소개', id: 'about' },
            { label: '문의', id: 'contact' },
          ].map(({ label, id }) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: C.muted, transition: 'color 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.wood)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >{label}</button>
          ))}
        </nav>

        <button
          onClick={() => scrollTo('contact')}
          style={{
            marginLeft: '2rem', padding: '0.5rem 1.25rem', borderRadius: '999px',
            background: C.wood, color: 'white', border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
          className="hidden md:block"
          onMouseEnter={e => (e.currentTarget.style.background = '#6d5637')}
          onMouseLeave={e => (e.currentTarget.style.background = C.wood)}
        >문의하기</button>

        {/* 모바일 햄버거 */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          className="block md:hidden"
        >
          <div style={{ width: '22px', height: '2px', background: C.text, marginBottom: '5px', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <div style={{ width: '22px', height: '2px', background: C.text, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
          <div style={{ width: '22px', height: '2px', background: C.text, marginTop: '5px', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </header>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99,
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '1rem',
        }}>
          {[{ label: '제품', id: 'products' }, { label: '회사소개', id: 'about' }, { label: '문의', id: 'contact' }].map(({ label, id }) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: C.text, fontFamily: 'inherit' }}
            >{label}</button>
          ))}
        </div>
      )}

      {/* 나머지 섹션은 다음 Task에서 추가 */}
      <div style={{ height: '100vh' }} />
    </div>
  )
}
```

- [ ] **Step 2: 브라우저에서 헤더 확인**

`http://localhost:5173/hdkd` 에서 헤더가 표시되고, 스크롤 시 배경이 생기는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/HdkdLanding.tsx
git commit -m "feat: hdkd landing - header with scroll effect"
```

---

## Task 3: 히어로 섹션 추가

**Files:**
- Modify: `src/pages/HdkdLanding.tsx`

- [ ] **Step 1: `{/* 나머지 섹션은 다음 Task에서 추가 */}` 부분을 히어로 섹션으로 교체**

`<div style={{ height: '100vh' }} />`를 제거하고 아래 히어로 섹션을 넣는다:

```tsx
      {/* ══ 히어로 ══ */}
      <section style={{
        minHeight: '100vh',
        background: `linear-gradient(160deg, ${C.beige} 0%, #EDE3D5 40%, #D4C4AE 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 5vw, 4rem) 4rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 배경 원형 장식 */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(139,111,71,0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(196,168,130,0.12) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '760px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(139,111,71,0.1)', border: `1px solid rgba(139,111,71,0.25)`,
              borderRadius: '999px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.75rem', fontWeight: 700, color: C.wood, letterSpacing: '0.05em',
            }}>
              <Leaf size={13} />
              국내 장인이 직접 만드는 원목 가구
            </div>

            <h1 style={{
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05,
              color: '#2A1F14', marginBottom: '1.25rem',
            }}>
              자연에서 온 가구,<br />
              <span style={{ color: C.wood }}>삶에 스며들다</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: C.muted,
              lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 2.5rem',
            }}>
              30년 경력의 장인이 한 땀 한 땀 제작하는<br />
              천연 원목 가구로 집을 채워보세요.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => scrollTo('products')}
                style={{
                  padding: '0.85rem 2rem', borderRadius: '999px',
                  background: C.wood, color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700,
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(139,111,71,0.35)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#6d5637'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = C.wood; e.currentTarget.style.transform = 'none' }}
              >제품 보기</button>
              <button
                onClick={() => scrollTo('contact')}
                style={{
                  padding: '0.85rem 2rem', borderRadius: '999px',
                  background: 'transparent', color: C.wood,
                  border: `2px solid ${C.wood}`, cursor: 'pointer',
                  fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.beige }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >문의하기</button>
            </div>
          </motion.div>
        </div>

        {/* 스크롤 다운 화살표 */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
            cursor: 'pointer', color: C.wood, opacity: 0.6,
          }}
          onClick={() => scrollTo('features')}
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>
```

- [ ] **Step 2: 브라우저에서 히어로 확인**

히어로 섹션이 풀 뷰포트 높이로 표시되고, 애니메이션과 스크롤 화살표가 정상 동작하는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/HdkdLanding.tsx
git commit -m "feat: hdkd landing - hero section"
```

---

## Task 4: 특징 섹션 추가

**Files:**
- Modify: `src/pages/HdkdLanding.tsx`

- [ ] **Step 1: 히어로 섹션 바로 아래에 특징 섹션 추가**

```tsx
      {/* ══ 특징 ══ */}
      <section id="features" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 5vw, 4rem)', background: C.surface }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.wood, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>WHY HDKD</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: C.text }}>
              HDKD를 선택하는 이유
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: <Armchair size={24} />,
                title: '자체 제작',
                desc: '외주 없이 자체 공방에서 직접 설계하고 제작합니다. 모든 가구는 장인의 손을 거쳐 완성됩니다.',
              },
              {
                icon: <Leaf size={24} />,
                title: '천연 원목 소재',
                desc: '국내산 자작나무, 참나무, 소나무 등 검증된 천연 목재만 사용합니다. 유해물질 없는 안전한 가구.',
              },
              {
                icon: <Wrench size={24} />,
                title: '평생 A/S 보장',
                desc: '구매 후에도 걱정 없습니다. 제작사로서의 책임감으로 평생 A/S를 지원합니다.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{
                  padding: '2rem', borderRadius: '16px',
                  background: C.beige, border: `1px solid rgba(139,111,71,0.12)`,
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(139,111,71,0.15)' }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: C.wood, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.6rem', color: C.text }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: C.muted, lineHeight: 1.75 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: 브라우저에서 특징 섹션 확인**

3개 카드가 그리드로 표시되고, 스크롤 시 페이드인 애니메이션과 호버 효과가 정상 동작하는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/HdkdLanding.tsx
git commit -m "feat: hdkd landing - features section"
```

---

## Task 5: 제품 갤러리 섹션 추가

**Files:**
- Modify: `src/pages/HdkdLanding.tsx`

- [ ] **Step 1: 특징 섹션 바로 아래에 제품 갤러리 섹션 추가**

```tsx
      {/* ══ 제품 갤러리 ══ */}
      <section id="products" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 5vw, 4rem)', background: C.bg }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.wood, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>PRODUCTS</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: C.text }}>
              대표 제품
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                style={{
                  borderRadius: '16px', overflow: 'hidden',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              >
                <div style={{ overflow: 'hidden', height: '220px' }}>
                  <motion.img
                    src={p.img}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} fill={C.wood} color={C.wood} />
                    ))}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.3rem', color: C.text }}>{p.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: C.muted }}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: 브라우저에서 제품 갤러리 확인**

6개 제품 카드가 그리드로 표시되고, 이미지 호버 시 확대 효과와 카드 호버 시 상승 효과가 동작하는지 확인. Unsplash 이미지가 정상 로드되는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/HdkdLanding.tsx
git commit -m "feat: hdkd landing - products gallery section"
```

---

## Task 6: 회사소개 섹션 추가

**Files:**
- Modify: `src/pages/HdkdLanding.tsx`

- [ ] **Step 1: 제품 갤러리 섹션 바로 아래에 회사소개 섹션 추가**

```tsx
      {/* ══ 회사소개 ══ */}
      <section id="about" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 5vw, 4rem)', background: C.surface }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>

          {/* 텍스트 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.wood, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>ABOUT US</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1.25rem', lineHeight: 1.2, color: C.text }}>
              30년 전통의<br />국내 원목 가구 전문점
            </h2>
            <p style={{ fontSize: '0.92rem', color: C.muted, lineHeight: 1.9, marginBottom: '1rem' }}>
              HDKD는 1995년 설립 이후 오직 천연 원목만을 사용해 직접 설계하고 제작하는
              자체 제작 가구 전문 브랜드입니다.
            </p>
            <p style={{ fontSize: '0.92rem', color: C.muted, lineHeight: 1.9 }}>
              외주 없이 자체 공방에서 숙련된 장인이 한 땀 한 땀 만들어내는 가구는
              오래 쓸수록 그 가치가 더해집니다.
            </p>
          </motion.div>

          {/* 수치 카운트업 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
          >
            {[
              { target: 30, suffix: '년', label: '브랜드 역사' },
              { target: 200, suffix: '+', label: '누적 제품' },
              { target: 5000, suffix: '+', label: '만족한 고객' },
              { target: 98, suffix: '%', label: '재구매율' },
            ].map(({ target, suffix, label }) => {
              const { count, ref } = useCountUp(target)
              return (
                <div key={label} style={{
                  padding: '1.5rem', borderRadius: '16px',
                  background: C.beige, border: `1px solid rgba(139,111,71,0.12)`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: C.wood, letterSpacing: '-0.02em' }}>
                    <span ref={ref}>{count.toLocaleString()}</span>{suffix}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '0.3rem', fontWeight: 600 }}>{label}</div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>
```

⚠️ `useCountUp`은 훅이므로 컴포넌트 바깥에서 직접 호출하면 안 된다. 위 코드의 `.map()` 안에서 `useCountUp`을 호출하는 부분은 훅 규칙 위반이다. 아래와 같이 별도 컴포넌트로 분리해야 한다:

```tsx
/* ── 카운트 아이템 컴포넌트 (훅 규칙 준수) ─────────────────── */
function CountItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(target)
  return (
    <div style={{
      padding: '1.5rem', borderRadius: '16px',
      background: C.beige, border: `1px solid rgba(139,111,71,0.12)`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: C.wood, letterSpacing: '-0.02em' }}>
        <span ref={ref}>{count.toLocaleString()}</span>{suffix}
      </div>
      <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: '0.3rem', fontWeight: 600 }}>{label}</div>
    </div>
  )
}
```

그리고 회사소개 섹션 수치 부분을:

```tsx
            {[
              { target: 30, suffix: '년', label: '브랜드 역사' },
              { target: 200, suffix: '+', label: '누적 제품' },
              { target: 5000, suffix: '+', label: '만족한 고객' },
              { target: 98, suffix: '%', label: '재구매율' },
            ].map((item) => (
              <CountItem key={item.label} {...item} />
            ))}
```

로 교체한다. `CountItem`은 파일 상단 `useCountUp` 바로 아래에 정의한다.

- [ ] **Step 2: 브라우저에서 회사소개 확인**

스크롤 시 카운트업 애니메이션이 실행되는지, 수치 카드 4개가 2×2 그리드로 표시되는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/HdkdLanding.tsx
git commit -m "feat: hdkd landing - about section with countup"
```

---

## Task 7: 문의 섹션 + 푸터 추가

**Files:**
- Modify: `src/pages/HdkdLanding.tsx`

- [ ] **Step 1: 회사소개 섹션 바로 아래에 문의 섹션 추가**

```tsx
      {/* ══ 문의 ══ */}
      <section id="contact" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 5vw, 4rem)', background: C.bg }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.wood, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>CONTACT</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: C.text }}>
              문의하기
            </h2>
            <p style={{ marginTop: '0.75rem', color: C.muted, fontSize: '0.9rem' }}>
              제품 상담, 구매 문의 등 편하게 연락주세요. 빠르게 답변 드립니다.
            </p>
          </motion.div>

          <ContactForm />
        </div>
      </section>
```

- [ ] **Step 2: `ContactForm` 컴포넌트를 파일 상단 (CountItem 아래)에 추가**

```tsx
/* ── 문의 폼 컴포넌트 ──────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '이름을 입력해 주세요.'
    if (!form.phone.trim()) e.phone = '연락처를 입력해 주세요.'
    if (!form.message.trim()) e.message = '문의 내용을 입력해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSending(true)
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'c98e903a-fbdb-4dfb-bf63-db3a1143a749',
          subject: `[HDKD 문의] ${form.name}`,
          from_name: form.name,
          message: `연락처: ${form.phone}\n\n${form.message}`,
        }),
      })
      if (res.ok) {
        setSent(true)
        setForm({ name: '', phone: '', message: '' })
        setErrors({})
      }
    } finally {
      setSending(false)
    }
  }

  const inputStyle = (key: string): React.CSSProperties => ({
    width: '100%', padding: '0.85rem 1rem', borderRadius: '12px',
    border: `1px solid ${errors[key] ? 'rgba(220,50,50,0.5)' : 'rgba(139,111,71,0.25)'}`,
    background: C.surface, color: C.text, fontSize: '0.9rem',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '3rem', background: C.surface, borderRadius: '20px', border: `1px solid ${C.border}` }}>
      <CheckCircle size={48} color={C.wood} style={{ marginBottom: '1rem' }} />
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>문의가 접수되었습니다!</h3>
      <p style={{ color: C.muted, fontSize: '0.88rem', marginBottom: '1.5rem' }}>빠른 시일 내에 연락 드리겠습니다.</p>
      <button onClick={() => setSent(false)} style={{
        padding: '0.6rem 1.5rem', borderRadius: '999px',
        background: C.wood, color: 'white', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
      }}>다시 문의하기</button>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{ background: C.surface, borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: `1px solid ${C.border}` }}
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {[
          { key: 'name', label: '이름', type: 'text', placeholder: '홍길동' },
          { key: 'phone', label: '연락처', type: 'tel', placeholder: '010-0000-0000' },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.muted, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>{label}</label>
            <input
              type={type} placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={inputStyle(key)}
              onFocus={e => { e.currentTarget.style.borderColor = C.wood; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(139,111,71,0.12)` }}
              onBlur={e => { e.currentTarget.style.borderColor = errors[key] ? 'rgba(220,50,50,0.5)' : 'rgba(139,111,71,0.25)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            {errors[key] && <p style={{ fontSize: '0.72rem', color: '#dc3232', marginTop: '0.25rem' }}>{errors[key]}</p>}
          </div>
        ))}

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.muted, marginBottom: '0.4rem' }}>문의 내용</label>
          <textarea
            rows={5} placeholder="문의하실 내용을 입력해 주세요..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            style={{ ...inputStyle('message'), resize: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = C.wood; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(139,111,71,0.12)` }}
            onBlur={e => { e.currentTarget.style.borderColor = errors.message ? 'rgba(220,50,50,0.5)' : 'rgba(139,111,71,0.25)'; e.currentTarget.style.boxShadow = 'none' }}
          />
          {errors.message && <p style={{ fontSize: '0.72rem', color: '#dc3232', marginTop: '0.25rem' }}>{errors.message}</p>}
        </div>

        <button
          type="submit" disabled={sending}
          style={{
            padding: '0.9rem', borderRadius: '12px',
            background: sending ? C.woodLight : C.wood,
            color: 'white', border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'background 0.2s',
          }}
        >
          <Send size={16} />
          {sending ? '전송 중...' : '문의 보내기'}
        </button>
      </form>
    </motion.div>
  )
}
```

- [ ] **Step 3: 푸터를 문의 섹션 아래에 추가**

```tsx
      {/* ══ 푸터 ══ */}
      <footer style={{
        background: '#2A1F14', color: 'rgba(255,255,255,0.6)',
        padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 5vw, 4rem)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: C.wood, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Armchair size={15} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>HDKD 가구</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.8 }}>자연에서 온 가구, 삶에 스며들다</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} color={C.woodLight} />
              <span>경기도 고양시 덕양구 ○○로 123</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={14} color={C.woodLight} />
              <span>031-000-0000</span>
            </div>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.woodLight)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <Instagram size={14} />
              <span>@hdkd_furniture</span>
            </a>
          </div>
        </div>

        <div style={{ maxWidth: '1100px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: 'rgba(255,255,255,0.1) 1px solid', fontSize: '0.75rem', textAlign: 'center' }}>
          © 2026 HDKD 가구. All rights reserved. · 이 페이지는 포트폴리오 목적으로 제작된 샘플입니다.
        </div>
      </footer>
```

- [ ] **Step 4: 브라우저에서 전체 페이지 확인**

- 문의 폼 유효성 검사 동작 확인 (빈 필드 제출 시 에러 메시지)
- 모바일 화면에서 전체 섹션 레이아웃 확인
- 모든 스크롤 애니메이션 정상 동작 확인
- 네비게이션 버튼 클릭 시 해당 섹션으로 부드럽게 스크롤되는지 확인

- [ ] **Step 5: 커밋**

```bash
git add src/pages/HdkdLanding.tsx
git commit -m "feat: hdkd landing - contact form and footer"
```

---

## Task 8: 빌드 확인 + Portfolio 페이지에 링크 추가

**Files:**
- Modify: `src/data/portfolio.ts`

- [ ] **Step 1: 프로덕션 빌드 확인**

```bash
npm run build
```

빌드 에러 없이 완료되는지 확인. TypeScript 타입 에러가 있으면 수정.

- [ ] **Step 2: portfolio.ts에 HDKD 항목 추가**

`src/data/portfolio.ts`를 열어 기존 항목 배열에 아래 항목을 추가한다 (실제 배열 구조에 맞게 필드 조정):

```ts
{
  title: 'HDKD 가구 웹사이트 리뉴얼',
  description: 'PHP 기반 구형 사이트를 React + TypeScript로 현대적으로 리뉴얼한 샘플 랜딩 페이지',
  tags: ['React', 'TypeScript', 'Framer Motion', 'Tailwind CSS'],
  link: '/hdkd',
  // 기존 필드에 맞게 추가
}
```

- [ ] **Step 3: 최종 커밋**

```bash
git add src/data/portfolio.ts
git commit -m "feat: add HDKD landing page to portfolio list"
```

---

## 자가 검토 결과

**스펙 커버리지 확인:**
- [x] 헤더 (스크롤 효과, 모바일 햄버거)
- [x] 히어로 (슬로건, CTA, 스크롤 화살표)
- [x] 특징 3가지 (자체제작, 원목소재, A/S)
- [x] 제품 갤러리 6개 (호버 효과)
- [x] 회사소개 (카운트업 수치 4개)
- [x] 문의 폼 (Web3Forms, 유효성 검사)
- [x] 푸터 (주소, 전화, 인스타그램)
- [x] `/hdkd` 라우트 추가
- [x] Portfolio 페이지 링크 추가

**타입 일관성:**
- `useCountUp`은 `CountItem` 컴포넌트 내부에서만 호출 (훅 규칙 준수)
- `ContactForm`은 독립 컴포넌트로 분리
- 색상 상수는 `C` 객체로 통일
