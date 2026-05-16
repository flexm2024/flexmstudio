import { useState, useEffect, useRef, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAdmin } from '../context/AdminContext'
import { useWindowWidth } from '../hooks/useWindowWidth'
import AdminLoginModal from './AdminLoginModal'
import AdminForgotPasswordModal from './AdminForgotPasswordModal'
import AdminPanel from './AdminPanel'

const navLinks = [
  { to: '/',          label: '홈' },
  { to: '/about',     label: '소개' },
  { to: '/portfolio', label: '포트폴리오' },
  { to: '/blog',      label: '블로그' },
  { to: '/resources', label: '자료공유' },
  { to: '/contact',   label: '연락처' },
]

const mobileNavIcons: Record<string, ReactElement> = {
  '/': (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  '/about': (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  '/portfolio': (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  '/blog': (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  '/resources': (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  '/contact': (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
}

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { isAdmin } = useAdmin()
  const { isMobile } = useWindowWidth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [showForgotPw, setShowForgotPw] = useState(false)
  const gearRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleGearClick = () => {
    if (isAdmin) setShowPanel(true)
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
            <NavLink to="/" reloadDocument style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/favicon.svg" alt="" aria-hidden="true" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
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
              </div>

              {/* 햄버거 - 모바일만 */}
              {isMobile && (
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  aria-label="메뉴"
                  style={{
                    padding: '0.45rem', borderRadius: '10px',
                    background: menuOpen ? 'color-mix(in srgb, var(--c-accent) 12%, var(--c-surface))' : 'var(--c-surface)',
                    border: menuOpen ? '1px solid color-mix(in srgb, var(--c-accent) 35%, transparent)' : '1px solid var(--c-border)',
                    color: menuOpen ? 'var(--c-accent)' : 'var(--c-muted)',
                    cursor: 'pointer', transition: 'all 0.25s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.25s', transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    {menuOpen
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 풀스크린 메뉴 오버레이 */}
      {isMobile && createPortal(
        <div
          style={{
            position: 'fixed', top: '4rem', left: 0, right: 0, bottom: 0, zIndex: 49,
            background: theme === 'dark' ? '#111318' : '#ffffff',
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 0.22s ease',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* 네비게이션 리스트 */}
          <nav style={{ flex: 1 }}>
            {navLinks.map(({ to, label }, i) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0 1.25rem',
                  height: '72px',
                  borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  background: isActive
                    ? (theme === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)')
                    : 'transparent',
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateY(0)' : 'translateY(-8px)',
                  transition: `opacity 0.3s ease ${i * 45 + 60}ms, transform 0.3s ease ${i * 45 + 60}ms`,
                })}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: isActive
                        ? 'rgba(99,102,241,0.18)'
                        : (theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? '#6366f1' : 'rgba(99,102,241,0.7)',
                      transition: 'all 0.2s',
                    }}>
                      {mobileNavIcons[to]}
                    </div>
                    <span style={{
                      flex: 1,
                      fontSize: '1.05rem', fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: isActive
                        ? '#6366f1'
                        : (theme === 'dark' ? '#e5e7eb' : '#111827'),
                    }}>
                      {label}
                    </span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>,
        document.body
      )}

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
          onForgotPassword={() => { setShowLogin(false); setShowForgotPw(true) }}
        />
      )}
      {showPanel && (
        <AdminPanel
          onClose={() => setShowPanel(false)}
          onForgotPassword={() => { setShowPanel(false); setShowForgotPw(true) }}
        />
      )}
      {showForgotPw && (
        <AdminForgotPasswordModal onClose={() => setShowForgotPw(false)} />
      )}
    </>
  )
}
