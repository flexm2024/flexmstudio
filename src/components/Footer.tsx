import { NavLink } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ borderTop: '1px solid var(--c-border)', marginTop: 'auto', background: 'var(--c-bg)', transition: 'background 0.35s, border-color 0.35s' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>

          <div>
            <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Paperlogy', var(--font-display)", background: 'linear-gradient(135deg,var(--c-accent),var(--c-accent-mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              FlexM Studio
            </span>
            <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--c-muted)', lineHeight: 1.6, transition: 'color 0.35s' }}>
              나의 디지털 공간입니다.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.35s' }}>페이지</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[['/', '홈'], ['/about', '소개'], ['/portfolio', '포트폴리오'], ['/resources', '자료공유'], ['/contact', '연락처']].map(([to, label]) => (
                <li key={to}>
                  <NavLink to={to} style={{ textDecoration: 'none', fontSize: '0.8rem', color: 'var(--c-muted)', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.35s' }}>연락처</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[['mailto:necc1321@gmail.com', 'necc1321@gmail.com'], ['https://github.com', 'GitHub'], ['https://linkedin.com', 'LinkedIn']].map(([href, label]) => (
                <li key={label}>
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    style={{ textDecoration: 'none', fontSize: '0.8rem', color: 'var(--c-muted)', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--c-border)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--c-muted)', transition: 'color 0.35s, border-color 0.35s' }}>
          © {year} FlexM Studio. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
