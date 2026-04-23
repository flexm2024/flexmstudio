import { useState, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faPaperPlane, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useMetaTags } from '../hooks/useMetaTags'

type MsgType = '' | '협업제안' | '자료요청' | '기타문의'

const MSG_TYPES: { value: MsgType; emoji: string }[] = [
  { value: '협업제안', emoji: '🤝' },
  { value: '자료요청', emoji: '📎' },
  { value: '기타문의', emoji: '💬' },
]

export default function Contact() {
  const [form, setForm]     = useState({ name: '', email: '', type: '' as MsgType, message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)
  const formRef = useScrollFadeIn()
  const infoRef = useScrollFadeIn()

  useMetaTags({ title: '연락하기', description: '협업 제안, 자료 요청, 커피챗 등 편하게 연락주세요.', keywords: '연락, 협업, 문의', canonical: '/contact' })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())    e.name    = '이름을 입력해 주세요.'
    if (!form.email.trim())   e.email   = '이메일을 입력해 주세요.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.'
    if (!form.type)           e.type    = '문의 종류를 선택해 주세요.'
    if (!form.message.trim()) e.message = '메시지를 입력해 주세요.'
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
          subject: `[포트폴리오 문의] ${form.type} - ${form.name}`,
          from_name: form.name,
          replyto: form.email,
          message: `문의 종류: ${form.type}\n보내는 이메일: ${form.email}\n\n${form.message}`,
        }),
      })
      if (res.ok) {
        setSent(true)
        setForm({ name: '', email: '', type: '', message: '' })
        setErrors({})
      }
    } finally {
      setSending(false)
    }
  }

  const baseInput: React.CSSProperties = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: '12px',
    background: 'var(--c-surface2)', color: 'var(--c-text)', fontSize: '0.875rem',
    outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s, box-shadow 0.2s',
    border: '1px solid var(--c-border)',
  }
  const errInput: React.CSSProperties = { ...baseInput, border: '1px solid rgba(255,64,96,0.5)' }
  const field = (k: keyof typeof errors) => errors[k] ? errInput : baseInput

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem', position: 'relative' }}>

      {/* 배경 장식 */}
      <div style={{
        position: 'absolute', top: '2rem', right: '-4rem', width: '500px', height: '500px',
        background: 'radial-gradient(ellipse, color-mix(in srgb, var(--c-accent) 6%, transparent) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* 헤더 */}
      <div style={{ marginBottom: '3.5rem', position: 'relative', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem',
          padding: '0.3rem 0.9rem', borderRadius: '999px',
          border: '1px solid color-mix(in srgb, var(--c-accent) 30%, transparent)',
          background: 'color-mix(in srgb, var(--c-accent) 8%, transparent)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-accent-mint)', display: 'inline-block', boxShadow: '0 0 6px var(--c-accent-mint)' }} />
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.08em' }}>CONTACT</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem',
          background: 'linear-gradient(135deg, var(--c-text) 40%, var(--c-accent) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          함께 만들어요
        </h1>

        <p style={{ color: 'var(--c-muted)', fontSize: '0.95rem', lineHeight: 1.8, maxWidth: '480px', margin: '0 auto' }}>
          협업 제안, 채용 문의, 단순한 인사 모두 환영합니다.
        </p>
        <div className="accent-bar" style={{ margin: '1.5rem auto 0' }} />
      </div>

      {/* 2단 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem', position: 'relative', zIndex: 1 }}>

        {/* ── 왼쪽: 정보 ── */}
        <div ref={infoRef} className="scroll-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* 안내 텍스트 카드 */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', lineHeight: 1.9 }}>
              아래 양식으로 메시지를 보내주시거나<br />
              직접 이메일로 연락해 주셔도 됩니다.
            </p>
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.1rem', borderRadius: '10px', background: 'color-mix(in srgb, var(--c-accent-mint) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent-mint) 20%, transparent)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FontAwesomeIcon icon={faClock} style={{ color: 'var(--c-accent-mint)', fontSize: '0.8rem' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>
                보통 <strong style={{ color: 'var(--c-accent-mint)' }}>24시간 내</strong> 답변 드립니다.
              </span>
            </div>
          </div>

          {/* 연락처 링크들 */}
          {[
            {
              icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
              label: '이메일', value: 'necc1321@gmail.com', href: 'mailto:necc1321@gmail.com',
            },
            {
              icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>,
              label: 'GitHub', value: 'github.com/necc1321', href: 'https://github.com/necc1321',
            },
          ].map(({ icon, label, value, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="card"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', textDecoration: 'none' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'color-mix(in srgb, var(--c-accent) 10%, transparent)',
                color: 'var(--c-accent)',
              }}>{icon}</div>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', marginBottom: '0.1rem', fontFamily: 'var(--font-mono)' }}>{label}</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-text)' }}>{value}</p>
              </div>
            </a>
          ))}
        </div>

        {/* ── 오른쪽: 폼 ── */}
        <div ref={formRef} className="scroll-fade">
          <div className="glow-card" style={{ padding: '2.5rem' }}>

            {sent ? (
              /* 전송 완료 상태 */
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1.25rem',
                  background: 'color-mix(in srgb, var(--c-accent-mint) 15%, transparent)',
                  border: '2px solid var(--c-accent-mint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faCheck} style={{ color: 'var(--c-accent-mint)', fontSize: '1.5rem' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.5rem' }}>메시지 전송 완료!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  빠른 시일 내에 답변 드리겠습니다.
                </p>
                <button onClick={() => setSent(false)} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.6rem 1.5rem' }}>
                  다시 보내기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* 이름 + 이메일 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {([
                    { label: '이름', key: 'name' as const, type: 'text', placeholder: '홍길동' },
                    { label: '이메일', key: 'email' as const, type: 'email', placeholder: 'hong@example.com' },
                  ] as const).map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', color: errors[key] ? 'var(--c-danger)' : 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>{label.toUpperCase()}</label>
                      <input type={type} placeholder={placeholder} value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        style={field(key)}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--c-accent) 12%, transparent)' }}
                        onBlur={e => { e.currentTarget.style.borderColor = errors[key] ? 'rgba(255,64,96,0.5)' : 'var(--c-border)'; e.currentTarget.style.boxShadow = 'none' }}
                      />
                      {errors[key] && <p style={{ fontSize: '0.68rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors[key]}</p>}
                    </div>
                  ))}
                </div>

                {/* 문의 종류 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', color: errors.type ? 'var(--c-danger)' : 'var(--c-muted)', marginBottom: '0.6rem', fontFamily: 'var(--font-mono)' }}>TYPE</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {MSG_TYPES.map(({ value, emoji }) => (
                      <button key={value} type="button" onClick={() => setForm(f => ({ ...f, type: value }))}
                        style={{
                          flex: 1, padding: '0.6rem 0.5rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                          border: form.type === value ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
                          background: form.type === value ? 'color-mix(in srgb, var(--c-accent) 12%, transparent)' : 'var(--c-surface2)',
                          color: form.type === value ? 'var(--c-accent)' : 'var(--c-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        }}>
                        <span>{emoji}</span>
                        <span>{value}</span>
                      </button>
                    ))}
                  </div>
                  {errors.type && <p style={{ fontSize: '0.68rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.type}</p>}
                </div>

                {/* 메시지 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', color: errors.message ? 'var(--c-danger)' : 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>MESSAGE</label>
                  <textarea rows={8} placeholder="안녕하세요, 협업 제안이 있어 연락드립니다..."
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{ ...field('message'), resize: 'none' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--c-accent) 12%, transparent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = errors.message ? 'rgba(255,64,96,0.5)' : 'var(--c-border)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                  {errors.message && <p style={{ fontSize: '0.68rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.message}</p>}
                </div>

                {/* 제출 버튼 */}
                <button type="submit" disabled={sending} className="btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', opacity: sending ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                  <FontAwesomeIcon icon={sending ? faClock : faPaperPlane} style={{ fontSize: '0.85rem' }} />
                  {sending ? '전송 중...' : '메시지 보내기'}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
