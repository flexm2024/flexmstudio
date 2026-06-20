import { useState, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import { useAdmin } from '../context/AdminContext'

interface Props { onClose: () => void }

export default function AdminChangePasswordModal({ onClose }: Props) {
  const { changePassword } = useAdmin()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPw.length < 4) { setError('새 비밀번호는 4자 이상이어야 합니다.'); return }
    if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return }

    setLoading(true)
    const ok = await changePassword(currentPw, newPw)
    setLoading(false)
    if (!ok) { setError('현재 비밀번호가 올바르지 않습니다.'); return }

    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
    background: 'var(--c-surface2)', border: `1px solid ${hasError ? 'var(--c-danger)' : 'var(--c-border)'}`,
    color: 'var(--c-text)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  })

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '2rem', animation: 'modalIn 0.25s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'color-mix(in srgb, var(--c-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.3rem', color: 'var(--c-accent)' }}>
            <FontAwesomeIcon icon={faKey} />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>비밀번호 변경</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>새 비밀번호를 설정합니다</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--c-accent-mint)', fontSize: '0.9rem', fontWeight: 600 }}>
            비밀번호가 변경되었습니다 ✓
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>현재 비밀번호</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setError('') }}
                placeholder="현재 비밀번호 입력"
                autoFocus
                style={inputStyle(!!error && error.includes('현재'))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>새 비밀번호</label>
              <input
                type="password"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setError('') }}
                placeholder="새 비밀번호 입력 (4자 이상)"
                style={inputStyle(!!error && !error.includes('현재'))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setError('') }}
                placeholder="새 비밀번호 재입력"
                style={inputStyle(!!error && error.includes('일치'))}
              />
            </div>

            {error && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '-0.3rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>취소</button>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>{loading ? '저장 중...' : '변경하기'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
