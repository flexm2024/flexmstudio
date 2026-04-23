import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAdmin } from '../context/AdminContext'
import { useWindowWidth } from '../hooks/useWindowWidth'
import AdminLoginModal from './AdminLoginModal'
import AdminChangePasswordModal from './AdminChangePasswordModal'

const navLinks = [
  { to: '/',          label: '홈' },
  { to: '/about',     label: '소개' },
  { to: '/portfolio', label: '포트폴리오' },
  { to: '/blog',      label: '블로그' },
  { to: '/resources', label: '자료공유' },
  { to: '/contact',   label: '연락처' },
]

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { isAdmin, logout } = useAdmin()
  const { isMobile } = useWindowWidth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [gearOpen, setGearOpen] = useState(false)
  const gearRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) setGearOpen(false)
    }
    if (gearOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [gearOpen])

  const handleGearClick = () => {
    if (isAdmin) setGearOpen(o => !o)
    else setShowLogin(true)
  }

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s',
        background: scrolled ? 'rgba(var(--c-bg-rgb, 8,12,24), 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--c-border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.15)' : 'none',
      }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>

            {/* 로고 */}
            <NavLink to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Paperlogy', var(--font-display)", background: 'linear-gradient(135deg,var(--c-accent),var(--c-accent-mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                FlexM Studio
              </span>
            </NavLink>

            {/* 데스크톱 네비 */}
            {!isMobile && (
              <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
                {navLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    style={({ isActive }) => ({
                      textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                      color: isActive ? 'var(--c-accent)' : 'var(--c-muted)',
                      transition: 'color 0.2s',
                    })}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            )}

            {/* 우측 컨트롤 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

              {/* 테마 토글 */}
              <button
                onClick={toggleTheme}
                aria-label="테마 전환"
                title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                style={{ padding: '0.45rem', borderRadius: '10px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}
              >
                {theme === 'dark' ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* 관리자 기어 버튼 */}
              <div ref={gearRef} style={{ position: 'relative' }}>
                <button
                  onClick={handleGearClick}
                  aria-label="관리자"
                  title={isAdmin ? '관리자 메뉴' : '관리자 로그인'}
                  style={{
                    padding: '0.45rem', borderRadius: '10px',
                    background: isAdmin ? 'color-mix(in srgb, var(--c-accent) 12%, var(--c-surface))' : 'var(--c-surface)',
                    border: isAdmin ? '1px solid color-mix(in srgb, var(--c-accent) 40%, transparent)' : '1px solid var(--c-border)',
                    color: isAdmin ? 'var(--c-accent)' : 'var(--c-muted)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {/* 관리자 드롭다운 */}
                {isAdmin && gearOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100,
                    background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                    borderRadius: '12px', padding: '0.5rem', minWidth: '160px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'fadeIn 0.15s ease',
                  }}>
                    <div style={{ padding: '0.4rem 0.75rem 0.6rem', borderBottom: '1px solid var(--c-border)', marginBottom: '0.4rem' }}>
                      <p style={{ fontSize: '0.65rem', color: 'var(--c-accent-mint)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>● 관리자 모드</p>
                    </div>
                    <button
                      onClick={() => { setShowChangePw(true); setGearOpen(false) }}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--c-muted)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'background 0.15s, color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--c-accent) 10%, transparent)'; e.currentTarget.style.color = 'var(--c-accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-muted)' }}
                    >
                      비밀번호 변경
                    </button>
                    <button
                      onClick={() => { logout(); setGearOpen(false) }}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--c-muted)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'background 0.15s, color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--c-danger) 10%, transparent)'; e.currentTarget.style.color = 'var(--c-danger)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-muted)' }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>

              {/* 햄버거 - 모바일만 */}
              {isMobile && <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="메뉴"
                style={{ padding: '0.45rem', borderRadius: '10px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>}
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div style={{
          overflow: 'hidden', maxHeight: menuOpen ? '280px' : '0', opacity: menuOpen ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
          background: 'var(--c-surface)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--c-border)',
        }}>
          <nav style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  textDecoration: 'none', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  fontSize: '0.875rem', fontWeight: 500,
                  color: isActive ? '#4f8aff' : 'var(--c-muted)',
                  background: isActive ? 'color-mix(in srgb, var(--c-accent) 10%, transparent)' : 'transparent',
                  transition: 'color 0.2s, background 0.2s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
      {showChangePw && (
        <AdminChangePasswordModal onClose={() => setShowChangePw(false)} />
      )}
    </>
  )
}
