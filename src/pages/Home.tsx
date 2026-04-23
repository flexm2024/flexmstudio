import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faBriefcase, faPenToSquare, faFolderOpen, faEnvelope,
  faLandmark, faBox, faRobot, faFileLines, faLink, faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { useCountUp } from '../hooks/useCountUp'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useMetaTags } from '../hooks/useMetaTags'
import ParticleCanvas from '../components/ParticleCanvas'
import CursorGlow from '../components/CursorGlow'
import TiltCard from '../components/TiltCard'

const phrases = ['IT 기획자', '아이디어 메이커', '디지털 큐레이터', '테크 인사이더', '서비스 기획자', '가구 디자이너']

function TypingText() {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const phrase = phrases[phraseIdx]
    let t: ReturnType<typeof setTimeout>
    if (!deleting && displayed.length < phrase.length)       t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 85)
    else if (!deleting && displayed.length === phrase.length) t = setTimeout(() => setDeleting(true), 2000)
    else if (deleting && displayed.length > 0)               t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length - 1)), 45)
    else { setDeleting(false); setPhraseIdx(i => (i + 1) % phrases.length) }
    return () => clearTimeout(t)
  }, [displayed, deleting, phraseIdx])
  return <span className="text-gradient-blue">{displayed}<span className="typing-cursor" /></span>
}

function Stat({ target, suffix, label, color }: { target: number; suffix: string; label: string; color: string }) {
  const { count, ref } = useCountUp(target)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <p className="stat-number" style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 700, color, lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '0.4rem', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

const navCards = [
  { to: '/about',     faIcon: faUser,        iconBg: 'linear-gradient(135deg,var(--c-accent),var(--c-accent-dark))',       title: '나에 대해',  desc: '경력, 관심사, 내가 걸어온 길을 소개합니다.',     glow: 'rgba(79,138,255,0.2)',  tag: 'About'     },
  { to: '/portfolio', faIcon: faBriefcase,   iconBg: 'linear-gradient(135deg,var(--c-accent-mint),var(--c-accent))',       title: '포트폴리오', desc: '참여하고 기획한 서비스와 프로젝트 모음.',         glow: 'rgba(56,232,160,0.2)',  tag: 'Portfolio'  },
  { to: '/blog',      faIcon: faPenToSquare, iconBg: 'linear-gradient(135deg,var(--c-accent-light),var(--c-accent-mint))', title: '블로그',     desc: 'IT 기획, 디지털 전환에 관한 생각과 기록.',       glow: 'rgba(79,138,255,0.15)', tag: 'Blog'       },
  { to: '/resources', faIcon: faFolderOpen,  iconBg: 'linear-gradient(135deg,var(--c-accent-light),var(--c-accent))',      title: '자료 공유',  desc: '유용한 파일, 링크, 템플릿을 공유합니다.',         glow: 'rgba(79,138,255,0.15)', tag: 'Resources'  },
  { to: '/contact',   faIcon: faEnvelope,    iconBg: 'linear-gradient(135deg,var(--c-accent),var(--c-accent-mint))',       title: '연락하기',   desc: '협업 제안이나 자료 요청은 편하게 연락주세요.',     glow: 'rgba(79,138,255,0.15)', tag: 'Contact'    },
]

const recentProjects = [
  { title: '복지정보 검색 웹사이트', desc: '공공 API로 복지 서비스를 한눈에', faIcon: faLandmark, accent: 'var(--c-accent)' },
  { title: '자재관리 웹앱',          desc: '중소기업 재고 관리 디지털 전환',   faIcon: faBox,      accent: 'var(--c-accent-mint)' },
  { title: 'AI 프롬프트 모음집',     desc: 'AI 도구 프롬프트 공유 플랫폼',    faIcon: faRobot,    accent: 'var(--c-accent-light)' },
]

const recentResources = [
  { title: 'React 컴포넌트 템플릿 모음', faIcon: faBox,       badge: '개발자료' },
  { title: 'CSS 애니메이션 치트시트',    faIcon: faFileLines, badge: '개발자료' },
  { title: '무료 아이콘 사이트 모음',    faIcon: faLink,      badge: '링크모음' },
]

export default function Home() {
  useMetaTags({
    title: 'FlexM Studio | 나의 디지털 공간',
    description: 'IT 기획자 FlexM의 디지털 공간. 서비스 기획, AI 활용, 디지털 전환에 관한 글과 자료를 공유합니다.',
    keywords: 'FlexM, IT 기획, 서비스 기획, 디지털 전환, AI, 포트폴리오',
    canonical: '/',
  })
  const statsRef    = useScrollFadeIn()
  const cardsRef    = useScrollFadeIn()
  const projectsRef = useScrollFadeIn()
  const resRef      = useScrollFadeIn()

  return (
    <div style={{ position: 'relative' }}>
      <CursorGlow />

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <ParticleCanvas />
        <div style={{ position: 'absolute', top: '10%',   left: '5%',  width: '500px', height: '500px', background: 'radial-gradient(circle, var(--c-orb1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', animation: 'float 8s ease-in-out infinite',    pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--c-orb2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', animation: 'floatB 10s ease-in-out infinite',   pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%',   right: '15%',width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,95,126,0.06) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', animation: 'float 12s ease-in-out infinite 2s', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'color-mix(in srgb, var(--c-accent-mint) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent-mint) 20%, transparent)', borderRadius: '999px', padding: '0.35rem 1.1rem', fontSize: '0.78rem', color: 'var(--c-accent-mint)', marginBottom: '2.5rem', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-accent-mint)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
            나의 디지털 공간에 오신 것을 환영합니다
          </div>

          <h1 style={{ fontSize: 'clamp(1rem,2.5vw,1.3rem)', fontWeight: 500, color: 'var(--c-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Hello, I'm</h1>
          <h1 style={{ fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 700, lineHeight: 1.05, marginBottom: '0.5rem' }} className="text-shimmer">FlexM</h1>
          <h2 style={{ fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 700, lineHeight: 1.3, marginBottom: '1.75rem', minHeight: '1.4em' }}>
            <TypingText />
          </h2>
          <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: 'var(--c-muted)', lineHeight: 1.9, maxWidth: '480px', margin: '0 auto 5rem', wordBreak: 'keep-all' }}>
            IT 기업에서 오랜 시간 서비스를 기획하고 사용해온 경험을 바탕으로,
            이 공간에 생각과 자료, 그리고 작업물들을 기록합니다.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
            <Link to="/portfolio" className="btn-primary" style={{ textDecoration: 'none' }}>포트폴리오 보기 →</Link>
            <Link to="/resources" className="btn-secondary" style={{ textDecoration: 'none' }}>자료 둘러보기</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--c-muted)' }}>
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scroll</span>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, var(--c-accent), transparent)', animation: 'float 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div ref={statsRef} className="scroll-fade glass-card" style={{ padding: '3rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--c-accent) 5%, transparent) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <Stat target={15}  suffix="년+" label="IT 업계 경력"  color="var(--c-accent)" />
          <Stat target={50}  suffix="+"   label="참여 프로젝트" color="var(--c-accent-mint)" />
          <Stat target={20}  suffix="+"   label="공유 자료"     color="var(--c-accent-light)" />
          <Stat target={100} suffix="%"   label="열정"          color="var(--c-accent-mint)" />
        </div>
      </section>

      {/* ══ 네비 카드 ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        <div ref={cardsRef} className="scroll-fade">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span className="text-gradient-all">이 공간을 탐색하세요</span>
            </h2>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>각 섹션을 클릭해서 둘러보세요</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {navCards.map((card, i) => (
              <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
                <TiltCard className="glow-card" style={{ padding: '2rem', cursor: 'pointer', transitionDelay: `${i * 80}ms`, height: '100%' }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: `radial-gradient(circle, ${card.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem', boxShadow: `0 8px 24px ${card.glow}`, position: 'relative', zIndex: 2, color: '#fff' }}>
                    <FontAwesomeIcon icon={card.faIcon} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)' }}>{card.title}</h3>
                      <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', fontFamily: "'Paperlogy', var(--font-display)" }}>/{card.tag}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', lineHeight: 1.7 }}>{card.desc}</p>
                    <div style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--c-accent)', fontWeight: 600 }}>바로가기 →</div>
                  </div>
                </TiltCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 최근 프로젝트 ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        <div ref={projectsRef} className="scroll-fade">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.3rem' }}>최근 작업물</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>최근에 기획하고 참여한 프로젝트</p>
            </div>
            <Link to="/portfolio" style={{ fontSize: '0.82rem', color: 'var(--c-accent)', textDecoration: 'none', border: '1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)', padding: '0.35rem 0.9rem', borderRadius: '999px' }}>
              전체 보기 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.25rem' }}>
            {recentProjects.map((p, i) => (
              <Link key={i} to="/portfolio" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.5rem', transitionDelay: `${i * 70}ms`, display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `${p.accent}18`, border: `1px solid ${p.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, color: p.accent }}>
                    <FontAwesomeIcon icon={p.faIcon} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.35rem' }}>{p.title}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>{p.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 최근 자료 + CTA ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem 8rem' }}>
        <div ref={resRef} className="scroll-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--c-text)' }}>최근 자료</h2>
              <Link to="/resources" style={{ fontSize: '0.78rem', color: 'var(--c-accent)', textDecoration: 'none' }}>전체 →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentResources.map((r, i) => (
                <Link key={i} to="/resources" className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.1rem', transitionDelay: `${i * 60}ms` }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--c-accent)' }}><FontAwesomeIcon icon={r.faIcon} /></span>
                  <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 500, color: 'var(--c-text)' }}>{r.title}</span>
                  <span className="badge-mint" style={{ fontSize: '0.65rem' }}>{r.badge}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="glow-card" style={{ padding: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--c-accent) 8%, transparent) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--c-accent)' }}><FontAwesomeIcon icon={faPaperPlane} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.6rem' }}>함께 만들어요</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>자료 요청, 협업 제안, 또는 단순한 인사도 환영합니다.</p>
            <Link to="/contact" className="btn-primary" style={{ textDecoration: 'none', width: '100%', display: 'flex' }}>연락하기 →</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
