import { useState, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-solid-svg-icons'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useMetaTags } from '../hooks/useMetaTags'

type MsgType = '' | '협업제안' | '자료요청' | '기타문의'

interface Toast { visible: boolean; msg: string }

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', type: '' as MsgType, message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<Toast>({ visible: false, msg: '' })
  const formRef = useScrollFadeIn()
  const infoRef = useScrollFadeIn()

  useMetaTags({ title: '연락하기', description: '협업 제안, 자료 요청, 커피챗 등 편하게 연락주세요.', keywords: '연락, 협업, 문의', canonical: '/contact' })

  const showToast = (msg: string) => {
    setToast({ visible: true, msg })
    setTimeout(() => setToast({ visible: false, msg: '' }), 3000)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())     e.name    = '이름을 입력해 주세요.'
    if (!form.email.trim())    e.email   = '이메일을 입력해 주세요.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.'
    if (!form.type)            e.type    = '문의 종류를 선택해 주세요.'
    if (!form.message.trim())  e.message = '메시지를 입력해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setForm({ name: '', email: '', type: '', message: '' })
    setErrors({})
    showToast('✓ 메시지가 접수되었습니다!')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
    background: 'var(--c-surface2)', color: 'var(--c-text)', fontSize: '0.875rem',
    outline: 'none', fontFamily: 'Noto Sans KR, sans-serif', transition: 'border-color 0.2s',
  }

  const field = (name: keyof typeof errors) =>
    errors[name]
      ? { ...inputStyle, border: '1px solid rgba(255,95,126,0.6)' }
      : { ...inputStyle, border: '1px solid var(--c-border)' }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>
      <h1 className="section-title">연락처</h1>
      <div className="accent-bar" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3.5rem' }}>

        {/* Info */}
        <div ref={infoRef} className="scroll-fade">
          <p style={{ color: 'var(--c-muted)', lineHeight: 1.8, fontSize: '0.875rem', marginBottom: '2rem' }}>
            프로젝트 협업, 채용 제안, 또는 단순한 인사 모두 환영합니다.<br />
            아래 연락처나 메시지 폼을 통해 편하게 연락해 주세요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { icon: <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>, label: '이메일', value: 'necc1321@gmail.com', href: 'mailto:necc1321@gmail.com' },
              { icon: <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>, label: 'GitHub', value: 'github.com/username', href: 'https://github.com' },
              { icon: <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, label: 'LinkedIn', value: 'linkedin.com/in/username', href: 'https://linkedin.com' },
            ].map(({ icon, label, value, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="card"
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', textDecoration: 'none' }}>
                <div style={{ color: 'var(--c-accent)', flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', marginBottom: '0.15rem' }}>{label}</p>
                  <p style={{ fontSize: '0.845rem', fontWeight: 500, color: 'var(--c-text)' }}>{value}</p>
                </div>
              </a>
            ))}
          </div>

          <div style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', background: 'color-mix(in srgb, var(--c-accent-mint) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent-mint) 15%, transparent)', fontSize: '0.8rem', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faClock} style={{ color: 'var(--c-accent-mint)', flexShrink: 0 }} />
            보통 <strong style={{ color: 'var(--c-accent-mint)' }}>24시간 내</strong> 답변 드립니다.
          </div>
        </div>

        {/* Form */}
        <div ref={formRef} className="scroll-fade">
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {[
              { label: '이름',    key: 'name' as const,  type: 'text',  placeholder: '홍길동' },
              { label: '이메일',  key: 'email' as const, type: 'email', placeholder: 'hong@example.com' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: errors[key] ? '#ff5f7e' : 'var(--c-muted)', marginBottom: '0.4rem' }}>{label}</label>
                <input type={type} required placeholder={placeholder} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={field(key)}
                  onFocus={e => { if (!errors[key]) e.currentTarget.style.borderColor = 'var(--c-accent)' }}
                  onBlur={e => { if (!errors[key]) e.currentTarget.style.borderColor = 'var(--c-border)' }}
                />
                {errors[key] && <p style={{ fontSize: '0.72rem', color: '#ff5f7e', marginTop: '0.3rem' }}>{errors[key]}</p>}
              </div>
            ))}

            {/* Message type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: errors.type ? '#ff5f7e' : 'var(--c-muted)', marginBottom: '0.4rem' }}>문의 종류</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['협업제안', '자료요청', '기타문의'] as MsgType[]).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-display)', border: form.type === t ? '1px solid var(--c-accent)' : '1px solid var(--c-border)', background: form.type === t ? 'color-mix(in srgb, var(--c-accent) 15%, transparent)' : 'transparent', color: form.type === t ? 'var(--c-accent)' : 'var(--c-muted)' }}>
                    {t}
                  </button>
                ))}
              </div>
              {errors.type && <p style={{ fontSize: '0.72rem', color: '#ff5f7e', marginTop: '0.3rem' }}>{errors.type}</p>}
            </div>

            {/* Message */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: errors.message ? '#ff5f7e' : 'var(--c-muted)', marginBottom: '0.4rem' }}>메시지</label>
              <textarea required rows={5} placeholder="안녕하세요, 협업 제안이 있어 연락드립니다..."
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                style={{ ...field('message'), resize: 'none' }}
                onFocus={e => { if (!errors.message) e.currentTarget.style.borderColor = 'var(--c-accent)' }}
                onBlur={e => { if (!errors.message) e.currentTarget.style.borderColor = 'var(--c-border)' }}
              />
              {errors.message && <p style={{ fontSize: '0.72rem', color: '#ff5f7e', marginTop: '0.3rem' }}>{errors.message}</p>}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              메시지 보내기
            </button>
          </form>
        </div>
      </div>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 300, background: 'var(--c-accent)', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, opacity: toast.visible ? 1 : 0, transform: toast.visible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.25s, transform 0.25s', pointerEvents: 'none' }}>
        {toast.msg}
      </div>
    </div>
  )
}
