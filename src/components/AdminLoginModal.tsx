import { useState, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useAdmin } from '../context/AdminContext'

interface Props { onClose: () => void; onSuccess: () => void; onForgotPassword: () => void }

export default function AdminLoginModal({ onClose, onSuccess, onForgotPassword }: Props) {
  const { login } = useAdmin()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await login(pw)
    setLoading(false)
    if (ok) { onSuccess() }
    else { setError('비밀번호가 올바르지 않습니다.'); setPw('') }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '2rem', animation: 'modalIn 0.25s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'color-mix(in srgb, var(--c-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.3rem', color: 'var(--c-accent)' }}>
            <FontAwesomeIcon icon={faLock} />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>관리자 로그인</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>블로그 관리 권한이 필요합니다</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError('') }}
              placeholder="관리자 비밀번호 입력"
              autoFocus
              style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', background: 'var(--c-surface2)', border: `1px solid ${error ? 'var(--c-danger)' : 'var(--c-border)'}`, color: 'var(--c-text)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--c-accent)' }}
              onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'var(--c-border)' }}
            />
            {error && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{error}</p>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>취소</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>{loading ? '확인 중...' : '로그인'}</button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button type="button" onClick={onForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)', transition: 'color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-accent)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)' }}>
              비밀번호를 잊으셨나요?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
