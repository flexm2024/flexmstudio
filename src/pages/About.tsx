import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useMetaTags } from '../hooks/useMetaTags'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { career, skills, interests, aboutStats } from '../data/about'

export default function About() {
  useMetaTags({
    title: '소개',
    description: 'IT 기획자 FlexM의 경력, 관심사, 걸어온 길을 소개합니다.',
    keywords: 'FlexM, IT 기획자, 소개, 경력, 서비스 기획',
    canonical: '/about',
  })

  const { isMobile } = useWindowWidth()
  const contentRef  = useScrollFadeIn()
  const careerRef   = useScrollFadeIn()
  const skillsRef   = useScrollFadeIn()
  const interestRef = useScrollFadeIn()

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem var(--page-px)' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '3.5rem', position: 'relative', textAlign: 'center' }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute', top: '-1.5rem', left: '50%', transform: 'translateX(-50%)',
          width: '400px', height: '140px',
          background: 'radial-gradient(ellipse, color-mix(in srgb, var(--c-accent) 8%, transparent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* 라벨 칩 */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem',
          padding: '0.3rem 0.9rem', borderRadius: '999px',
          border: '1px solid color-mix(in srgb, var(--c-accent) 30%, transparent)',
          background: 'color-mix(in srgb, var(--c-accent) 8%, transparent)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-accent-mint)', display: 'inline-block', boxShadow: '0 0 6px var(--c-accent-mint)' }} />
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.08em' }}>ABOUT ME</span>
        </div>

        {/* 타이틀 */}
        <h1 style={{
          fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', fontWeight: 900,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.04em',
          lineHeight: 1.05, marginBottom: '1rem',
          background: 'linear-gradient(135deg, var(--c-text) 40%, var(--c-accent) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          걸어온 길,<br />그리고 저
        </h1>

        {/* 서브타이틀 */}
        <p style={{ color: 'var(--c-muted)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 1.75rem' }}>
          IT 기획부터 가구 제작까지, 다양한 현장을 거쳐온 경험을 소개합니다.
        </p>

        {/* 통계 칩 */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem', justifyContent: 'center' }}>
          {aboutStats.map(s => (
            <div key={s.label} style={{
              padding: '0.55rem 1.1rem', borderRadius: '12px',
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              display: 'flex', alignItems: 'baseline', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--c-accent)' }}>{s.num}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="accent-bar" style={{ margin: '0 auto' }} />
      </div>

      {/* 2단 레이아웃: 캐릭터 왼쪽 고정 + 내용 오른쪽 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── 왼쪽: 캐릭터 ── */}
        {!isMobile && (
          <div style={{ position: 'sticky', top: '5.5rem', textAlign: 'center' }}>
            <img
              src="/character.png"
              alt="FlexM 캐릭터"
              style={{
                width: '100%',
                height: '640px',
                objectFit: 'cover',
                objectPosition: '48% top',
                display: 'block',
                borderRadius: '16px',
              }}
            />
          </div>
        )}

        {/* ── 오른쪽: 내용 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          {/* 소개 */}
          <div ref={contentRef} className="scroll-fade glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '1rem', fontFamily: "'Paperlogy', var(--font-display)" }}>안녕하세요 👋</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--c-muted)', lineHeight: 1.95, fontFamily: "'Paperlogy', var(--font-sans)" }}>
              IT 업계에서 12년간 서비스를 기획하고 사용자 중심의 디지털 경험을 만들어왔습니다.
              기술과 사람 사이의 다리를 놓는 것이 저의 일이자 즐거움입니다.
              이 공간에 생각과 자료, 그리고 작업물들을 기록합니다.
            </p>
          </div>

          {/* 경력 */}
          <section>
            <div ref={careerRef} className="scroll-fade">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '1.25rem', fontFamily: "'Paperlogy', var(--font-display)" }}>경력</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {career.map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', padding: '1.1rem 0', borderBottom: '1px solid var(--c-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--c-accent)', fontFamily: 'var(--font-mono)', fontWeight: 600, paddingTop: '0.15rem' }}>{c.year}</span>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.25rem', fontFamily: "'Paperlogy', var(--font-display)" }}>{c.role}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', lineHeight: 1.7, fontFamily: "'Paperlogy', var(--font-sans)" }}>{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 스킬 */}
          <section>
            <div ref={skillsRef} className="scroll-fade">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '1.25rem', fontFamily: "'Paperlogy', var(--font-display)" }}>스킬 & 도구</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                {skills.map((s, i) => (
                  <div key={i} className="card" style={{ padding: '1.25rem 1.1rem 1.1rem' }}>
                    {/* 상단 액센트 라인 */}
                    <div style={{ position: 'absolute', top: 0, left: '1.1rem', right: '1.1rem', height: '2px', background: 'linear-gradient(90deg, var(--c-accent), color-mix(in srgb, var(--c-accent-mint) 60%, transparent))', borderRadius: '0 0 4px 4px' }} />
                    <p style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--c-accent)', fontFamily: "'Paperlogy', var(--font-display)", marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {s.items.map(item => <span key={item} className="badge">{item}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 관심사 */}
          <section>
            <div ref={interestRef} className="scroll-fade">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '1.25rem', fontFamily: "'Paperlogy', var(--font-display)" }}>관심사</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {interests.map((item, i) => (
                  <div key={i} className="card" style={{ padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'color-mix(in srgb, var(--c-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent) 18%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FontAwesomeIcon icon={item.icon} style={{ color: 'var(--c-accent)', fontSize: '0.78rem' }} />
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--c-text)', fontWeight: 600, fontFamily: "'Paperlogy', var(--font-sans)" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
