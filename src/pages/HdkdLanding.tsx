import { useState, useEffect, useRef, type FormEvent } from 'react'
import { motion, useInView } from 'motion/react'
import {
  Armchair, Leaf, Wrench, Star, Phone, MapPin,
  ChevronDown, Send, CheckCircle, AtSign,
} from 'lucide-react'

/* ── 색상 상수 ─────────────────────────────────────────────── */
const C = {
  bg:        '#FAFAF8',
  surface:   '#FFFFFF',
  border:    'rgba(139,111,71,0.15)',
  wood:      '#8B6F47',
  woodLight: '#C4A882',
  text:      '#1A1A1A',
  muted:     '#6B6B6B',
  beige:     '#F5EFE6',
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

/* ── 카운트 아이템 컴포넌트 ────────────────────────────────── */
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
        {([
          { key: 'name', label: '이름', type: 'text', placeholder: '홍길동' },
          { key: 'phone', label: '연락처', type: 'tel', placeholder: '010-0000-0000' },
        ] as const).map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.muted, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>{label}</label>
            <input
              type={type} placeholder={placeholder}
              value={form[key]}
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

/* ── 메인 컴포넌트 ─────────────────────────────────────────── */
export default function HdkdLanding() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const NAV = [
    { label: '제품', id: 'products' },
    { label: '회사소개', id: 'about' },
  ]

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Pretendard, sans-serif', overflowX: 'hidden' }}>

      {/* ══ 헤더 ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: '64px',
        background: 'rgba(250,250,248,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
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
        <nav style={{ display: 'flex', gap: '2rem' }}>
          {NAV.map(({ label, id }) => (
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
          onMouseEnter={e => (e.currentTarget.style.background = '#6d5637')}
          onMouseLeave={e => (e.currentTarget.style.background = C.wood)}
        >문의하기</button>

        {/* 모바일 햄버거 */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '1rem', display: 'none' }}
          id="hamburger-btn"
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
          {NAV.map(({ label, id }) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: C.text, fontFamily: 'inherit' }}
            >{label}</button>
          ))}
        </div>
      )}

      {/* ══ 히어로 ══ */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem) 4rem',
      }}>
        {/* 배경 이미지 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.55)',
        }} />
        {/* 반투명 베이지 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(90,60,30,0.55) 0%, rgba(42,31,20,0.65) 100%)',
        }} />

        <div style={{ maxWidth: '760px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.12)', border: `1px solid rgba(255,255,255,0.3)`,
              borderRadius: '999px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em',
            }}>
              <Leaf size={13} />
              국내 장인이 직접 만드는 원목 가구
            </div>

            <h1 style={{
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05,
              color: '#FFFFFF', marginBottom: '1.25rem',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
              자연에서 온 가구,<br />
              <span style={{ color: C.woodLight }}>삶에 스며들다</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.8)',
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

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
            cursor: 'pointer', color: 'white', opacity: 0.7,
          }}
          onClick={() => scrollTo('features')}
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

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
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(139,111,71,0.15)' }}
                style={{
                  padding: '2rem', borderRadius: '16px',
                  background: C.beige, border: `1px solid rgba(139,111,71,0.12)`,
                  transition: 'box-shadow 0.25s',
                }}
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
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                style={{
                  borderRadius: '16px', overflow: 'hidden',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.25s',
                }}
              >
                <div style={{ overflow: 'hidden', height: '220px' }}>
                  <motion.img
                    src={p.img}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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

      {/* ══ 회사소개 ══ */}
      <section id="about" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 5vw, 4rem)', background: C.surface }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>

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
            ].map((item) => (
              <CountItem key={item.label} {...item} />
            ))}
          </motion.div>
        </div>
      </section>

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
              <AtSign size={14} />
              <span>@hdkd_furniture</span>
            </a>
          </div>
        </div>

        <div style={{ maxWidth: '1100px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', textAlign: 'center' }}>
          © 2026 HDKD 가구. All rights reserved. · 이 페이지는 포트폴리오 목적으로 제작된 샘플입니다.
        </div>
      </footer>

    </div>
  )
}
