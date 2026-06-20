// 자동 블로그 생성기 온오프를 관리하는 관리자 모달

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

function getToken() {
  return sessionStorage.getItem('adm_token') ?? ''
}

export default function AdminAutoBlogModal({ onClose }: { onClose: () => void }) {
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

  const toggle = async () => {
    if (enabled === null || saving) return
    setSaving(true)
    setError('')
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
  }

  const isOn = enabled === true

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '2rem', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', animation: 'modalIn 0.25s ease' }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)', marginBottom: '0.2rem' }}>자동 블로그 생성기</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>RSS 뉴스 수집 → AI 글 작성 → 자동 발행</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 상태 카드 */}
        <div style={{ background: 'var(--c-surface2)', border: `1px solid ${loading ? 'var(--c-border)' : isOn ? 'color-mix(in srgb, var(--c-accent-mint) 40%, transparent)' : 'var(--c-border)'}`, borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', transition: 'border-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', marginBottom: '0.3rem' }}>현재 상태</p>
              {loading ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--c-muted)' }}>불러오는 중...</p>
              ) : (
                <p style={{ fontSize: '1rem', fontWeight: 700, color: isOn ? 'var(--c-accent-mint)' : 'var(--c-muted)' }}>
                  {isOn ? '● 활성화' : '○ 비활성화'}
                </p>
              )}
            </div>

            {/* 토글 스위치 */}
            <button
              onClick={toggle}
              disabled={loading || saving}
              style={{
                width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: loading || saving ? 'not-allowed' : 'pointer',
                background: isOn ? 'var(--c-accent-mint)' : 'var(--c-border)',
                position: 'relative', transition: 'background 0.25s', opacity: loading ? 0.5 : 1,
              }}
              aria-label="자동 글 생성기 토글"
            >
              <span style={{
                position: 'absolute', top: '3px', left: isOn ? '27px' : '3px',
                width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.25s',
              }} />
            </button>
          </div>
        </div>

        {/* 오류 */}
        {error && (
          <p style={{ fontSize: '0.78rem', color: 'var(--c-danger)', marginBottom: '1rem', padding: '0.6rem 0.85rem', background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--c-danger) 25%, transparent)' }}>{error}</p>
        )}

        {/* 설명 */}
        <div style={{ fontSize: '0.78rem', color: 'var(--c-muted)', lineHeight: 1.7, borderTop: '1px solid var(--c-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: 'var(--c-accent)', fontWeight: 600, flexShrink: 0 }}>주기</span>
            <span>11시간마다 1회 실행 (Windows 작업 스케줄러)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: 'var(--c-accent)', fontWeight: 600, flexShrink: 0 }}>소스</span>
            <span>TechCrunch · Ars Technica · OpenAI Blog</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: 'var(--c-accent)', fontWeight: 600, flexShrink: 0 }}>동작</span>
            <span>RSS 수집 → Claude AI 한국어 작성 → 자동 발행</span>
          </div>
          <p style={{ marginTop: '0.25rem', padding: '0.5rem 0.75rem', background: 'color-mix(in srgb, var(--c-warning) 8%, transparent)', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--c-warning) 25%, transparent)', color: 'var(--c-warning)', fontSize: '0.73rem' }}>
            비활성화 시 다음 실행 사이클부터 적용됩니다.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
