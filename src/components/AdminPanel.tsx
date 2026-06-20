// 관리자 패널 - 사이드바 + 콘텐츠 프레임 레이아웃

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAdmin } from '../context/AdminContext'
import { useBlogPosts } from '../hooks/useBlogPosts'

type Section = 'dashboard' | 'password' | 'autoblog'

function getToken() {
  return sessionStorage.getItem('adm_token') ?? ''
}

// ── 아이콘 SVG ──────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={1.8} />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={1.8} />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={1.8} />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={1.8} />
    </svg>
  ),
  password: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  autoblog: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

// ── 대시보드 ────────────────────────────────────────────────────
function DashboardSection() {
  const { posts } = useBlogPosts()
  const [autoBlogEnabled, setAutoBlogEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auto-blog')
      .then(r => r.json())
      .then((d: { enabled: boolean }) => setAutoBlogEnabled(d.enabled))
      .catch(() => {})
  }, [])

  const lastPost = posts[0]
  const stats = [
    { label: '블로그 글', value: posts.length, sub: lastPost ? `최근 ${lastPost.date}` : '글 없음', color: 'var(--c-accent)' },
    {
      label: '자동 생성기',
      value: autoBlogEnabled === null ? '—' : autoBlogEnabled ? 'ON' : 'OFF',
      sub: autoBlogEnabled ? '11시간 주기 실행 중' : '비활성화 상태',
      color: autoBlogEnabled ? 'var(--c-accent-mint)' : 'var(--c-muted)',
    },
    { label: 'RSS 소스', value: 3, sub: 'TC · Ars · OpenAI', color: 'var(--c-accent-light)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>대시보드</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>사이트 운영 현황</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '0.35rem' }}>{s.value}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>최근 게시글</p>
        {posts.slice(0, 3).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--c-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>{p.title}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{p.date}</span>
          </div>
        ))}
        {posts.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', textAlign: 'center', padding: '1rem 0' }}>게시글 없음</p>}
      </div>
    </div>
  )
}

// ── 비밀번호 변경 ───────────────────────────────────────────────
function PasswordSection({ onForgot }: { onForgot: () => void }) {
  const { changePassword } = useAdmin()
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== confirm) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    if (next.length < 4) { setError('비밀번호는 4자 이상이어야 합니다.'); return }
    setSaving(true); setError(''); setSuccess(false)
    const ok = await changePassword(cur, next)
    setSaving(false)
    if (ok) { setSuccess(true); setCur(''); setNext(''); setConfirm('') }
    else setError('현재 비밀번호가 올바르지 않습니다.')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px',
    background: 'var(--c-surface2)', border: '1px solid var(--c-border)',
    color: 'var(--c-text)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>비밀번호 변경</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>관리자 로그인 비밀번호를 변경합니다.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '360px' }}>
        {[
          { label: '현재 비밀번호', value: cur, set: setCur },
          { label: '새 비밀번호', value: next, set: setNext },
          { label: '새 비밀번호 확인', value: confirm, set: setConfirm },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>{label}</label>
            <input
              type="password"
              value={value}
              onChange={e => set(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--c-accent)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border)' }}
            />
          </div>
        ))}

        {error && <p style={{ fontSize: '0.78rem', color: 'var(--c-danger)', padding: '0.5rem 0.75rem', background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--c-danger) 25%, transparent)', borderRadius: '8px' }}>{error}</p>}
        {success && <p style={{ fontSize: '0.78rem', color: 'var(--c-accent-mint)', padding: '0.5rem 0.75rem', background: 'color-mix(in srgb, var(--c-accent-mint) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent-mint) 25%, transparent)', borderRadius: '8px' }}>비밀번호가 변경되었습니다.</p>}

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginTop: '0.25rem' }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.4rem', opacity: saving ? 0.6 : 1 }}>
            {saving ? '저장 중...' : '변경하기'}
          </button>
          <button type="button" onClick={onForgot} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-sans)' }}>
            비밀번호를 잊으셨나요?
          </button>
        </div>
      </form>
    </div>
  )
}

// ── 자동 글 생성기 ──────────────────────────────────────────────
function AutoBlogSection() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auto-blog')
      .then(r => r.json())
      .then((d: { enabled: boolean }) => { setEnabled(d.enabled); setLoading(false) })
      .catch(() => { setError('상태를 불러오지 못했습니다.'); setLoading(false) })
  }, [])

  const toggle = useCallback(async () => {
    if (enabled === null || saving) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/auto-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ enabled: !enabled }),
      })
      if (!res.ok) { setError('변경에 실패했습니다.'); return }
      setEnabled(e => !e)
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }, [enabled, saving])

  const isOn = enabled === true

  const rss = [
    { name: 'TechCrunch', url: 'techcrunch.com' },
    { name: 'Ars Technica', url: 'arstechnica.com' },
    { name: 'OpenAI Blog', url: 'openai.com/blog' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>자동 글 생성기</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>RSS 뉴스 수집 → Claude AI 한국어 작성 → 자동 발행</p>
      </div>

      {/* 상태 + 토글 */}
      <div style={{ background: 'var(--c-surface2)', border: `1px solid ${loading ? 'var(--c-border)' : isOn ? 'color-mix(in srgb, var(--c-accent-mint) 40%, transparent)' : 'var(--c-border)'}`, borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.3s' }}>
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>현재 상태</p>
          {loading
            ? <p style={{ fontSize: '0.95rem', color: 'var(--c-muted)' }}>불러오는 중...</p>
            : <p style={{ fontSize: '1rem', fontWeight: 700, color: isOn ? 'var(--c-accent-mint)' : 'var(--c-muted)' }}>{isOn ? '● 활성화' : '○ 비활성화'}</p>
          }
        </div>
        <button
          onClick={toggle}
          disabled={loading || saving}
          style={{ width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: loading || saving ? 'not-allowed' : 'pointer', background: isOn ? 'var(--c-accent-mint)' : 'color-mix(in srgb, var(--c-muted) 40%, transparent)', position: 'relative', transition: 'background 0.25s', opacity: loading ? 0.5 : 1, flexShrink: 0 }}
        >
          <span style={{ position: 'absolute', top: '3px', left: isOn ? '27px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.25s' }} />
        </button>
      </div>

      {error && <p style={{ fontSize: '0.78rem', color: 'var(--c-danger)', padding: '0.6rem 0.85rem', background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--c-danger) 25%, transparent)' }}>{error}</p>}

      {/* 설정 정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        <div style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1rem 1.1rem' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>실행 주기</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-accent)', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '0.25rem' }}>11h</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>Windows 작업 스케줄러</p>
        </div>
        <div style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1rem 1.1rem' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>AI 모델</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--c-accent)', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '0.25rem' }}>Sonnet</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>claude-sonnet-4-6</p>
        </div>
      </div>

      {/* RSS 소스 */}
      <div style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>RSS 소스</p>
        {rss.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--c-text)', fontWeight: 500 }}>{s.name}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{s.url}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.73rem', color: 'var(--c-warning)', padding: '0.5rem 0.75rem', background: 'color-mix(in srgb, var(--c-warning) 8%, transparent)', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--c-warning) 25%, transparent)' }}>
        비활성화 시 다음 실행 사이클부터 적용됩니다.
      </p>
    </div>
  )
}

// ── 메인 패널 ────────────────────────────────────────────────────
interface Props {
  onClose: () => void
  onForgotPassword: () => void
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '대시보드', icon: Icons.dashboard },
  { id: 'password',  label: '비밀번호 변경', icon: Icons.password },
  { id: 'autoblog',  label: '자동 글 생성기', icon: Icons.autoblog },
]

export default function AdminPanel({ onClose, onForgotPassword }: Props) {
  const { logout } = useAdmin()
  const [active, setActive] = useState<Section>('dashboard')

  const handleLogout = () => { logout(); onClose() }

  const handleForgot = () => { onClose(); onForgotPassword() }

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', width: '100%', maxWidth: '860px', height: '560px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 96px rgba(0,0,0,0.4)', animation: 'modalIn 0.25s ease' }}
      >
        {/* ── 사이드바 ── */}
        <div style={{ width: '200px', flexShrink: 0, background: 'var(--c-surface2)', borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column' }}>
          {/* 사이드바 헤더 */}
          <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--c-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.6rem', color: 'var(--c-accent-mint)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.2rem' }}>● 관리자 모드</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>관리자 설정</p>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'var(--c-border)', border: 'none', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {Icons.close}
              </button>
            </div>
          </div>

          {/* 내비 */}
          <nav style={{ flex: 1, padding: '0.75rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: '9px', border: 'none',
                  background: active === item.id ? 'color-mix(in srgb, var(--c-accent) 12%, transparent)' : 'transparent',
                  color: active === item.id ? 'var(--c-accent)' : 'var(--c-muted)',
                  fontSize: '0.82rem', fontWeight: active === item.id ? 600 : 400,
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                  borderLeft: active === item.id ? '2px solid var(--c-accent)' : '2px solid transparent',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* 로그아웃 */}
          <div style={{ padding: '0.75rem 0.6rem', borderTop: '1px solid var(--c-border)' }}>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '9px', border: 'none', background: 'transparent', color: 'var(--c-muted)', fontSize: '0.82rem', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--c-danger) 10%, transparent)'; e.currentTarget.style.color = 'var(--c-danger)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-muted)' }}
            >
              {Icons.logout}
              로그아웃
            </button>
          </div>
        </div>

        {/* ── 콘텐츠 프레임 ── */}
        <div style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
          {active === 'dashboard' && <DashboardSection />}
          {active === 'password'  && <PasswordSection onForgot={handleForgot} />}
          {active === 'autoblog'  && <AutoBlogSection />}
        </div>
      </div>
    </div>,
    document.body
  )
}
