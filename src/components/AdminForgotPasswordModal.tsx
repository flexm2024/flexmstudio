import { useState, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useAdmin } from '../context/AdminContext'

interface Props { onClose: () => void }

type Step = 'request' | 'verify' | 'success'

export default function AdminForgotPasswordModal({ onClose }: Props) {
  const { requestPasswordReset, confirmPasswordReset } = useAdmin()
  const [step, setStep] = useState<Step>('request')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const startCooldown = () => {
    setCooldown(60)
    const t = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(t); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleRequest = async () => {
    setLoading(true)
    setError('')
    const result = await requestPasswordReset()
    setLoading(false)
    if (!result.ok) { setError(result.error ?? '오류가 발생했습니다'); return }
    setMaskedEmail(result.maskedEmail ?? '등록된 이메일')
    setStep('verify')
    startCooldown()
  }

  const handleResend = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError('')
    const result = await requestPasswordReset()
    setLoading(false)
    if (!result.ok) { setError(result.error ?? '오류가 발생했습니다'); return }
    setOtp('')
    startCooldown()
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) { setError('6자리 코드를 입력해 주세요'); return }
    if (newPw.length < 4) { setError('새 비밀번호는 4자 이상이어야 합니다'); return }
    if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다'); return }
    setLoading(true)
    const result = await confirmPasswordReset(otp, newPw)
    setLoading(false)
    if (!result.ok) { setError(result.error ?? '인증에 실패했습니다'); return }
    setStep('success')
    setTimeout(onClose, 2000)
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
    background: 'var(--c-surface2)', border: `1px solid ${hasError ? 'var(--c-danger)' : 'var(--c-border)'}`,
    color: 'var(--c-text)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  })

  const titles: Record<Step, string> = {
    request: '비밀번호 찾기',
    verify: '비밀번호 재설정',
    success: '재설정 완료',
  }

  const subtitles: Record<Step, string> = {
    request: '등록된 이메일로 인증 코드를 발송합니다',
    verify: `${maskedEmail}으로 발송된 코드를 입력하세요`,
    success: '새 비밀번호로 로그인하세요',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '2rem', animation: 'modalIn 0.25s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'color-mix(in srgb, var(--c-accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.3rem', color: 'var(--c-accent)' }}>
            <FontAwesomeIcon icon={faEnvelope} />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>{titles[step]}</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>{subtitles[step]}</p>
        </div>

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--c-accent-mint)', fontSize: '0.9rem', fontWeight: 600 }}>
            비밀번호가 재설정되었습니다 ✓
          </div>
        )}

        {step === 'request' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ background: 'color-mix(in srgb, var(--c-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: 'var(--c-danger)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>취소</button>
              <button type="button" onClick={handleRequest} disabled={loading} className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
                {loading ? '발송 중...' : '인증 코드 받기'}
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>인증 코드</label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  style={{ fontSize: '0.7rem', color: cooldown > 0 ? 'var(--c-muted)' : 'var(--c-accent)', background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}
                >
                  {cooldown > 0 ? `재발송 (${cooldown}s)` : '코드 재발송'}
                </button>
              </div>
              <input
                type="text"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                placeholder="6자리 코드 입력"
                inputMode="numeric"
                autoFocus
                style={{ ...inputStyle(!!error && (error.includes('코드') || error.includes('인증'))), letterSpacing: '0.3em', fontSize: '1.1rem', textAlign: 'center' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>새 비밀번호</label>
              <input
                type="password"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setError('') }}
                placeholder="새 비밀번호 입력 (4자 이상)"
                style={inputStyle(!!error && error.includes('비밀번호') && !error.includes('일치'))}
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
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>{loading ? '확인 중...' : '재설정하기'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
