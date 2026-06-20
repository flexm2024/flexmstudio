import { useEffect, useRef } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'

export default function Layout() {
  const location = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (mainRef.current) {
      mainRef.current.classList.remove('page-enter')
      void mainRef.current.offsetWidth
      mainRef.current.classList.add('page-enter')
    }
  }, [location.pathname])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)', color: 'var(--c-text)', transition: 'background 0.35s ease, color 0.35s ease', overflowX: 'hidden' }}>
      <Header />
      <main ref={mainRef} className="page-enter" style={{ flex: 1, paddingTop: '4rem' }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}
