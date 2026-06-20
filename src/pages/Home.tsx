import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useMetaTags } from '../hooks/useMetaTags'
import { useBlogPosts } from '../hooks/useBlogPosts'
import ParticleCanvas from '../components/ParticleCanvas'
import CursorGlow from '../components/CursorGlow'
import { getIcon } from '../lib/icons'
import { phrases, navCards, recentResources } from '../data/home'
import { usePortfolioProjects } from '../hooks/usePortfolioProjects'

const BLOG_COVER_VARIANTS = [
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 25%, transparent), color-mix(in srgb, var(--c-accent-mint) 12%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent-mint) 22%, transparent), color-mix(in srgb, var(--c-accent) 10%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent-light) 20%, transparent), color-mix(in srgb, var(--c-accent-mint) 10%, transparent))',
]

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

export default function Home() {
  useMetaTags({
    title: 'FlexM Studio | 나의 디지털 공간',
    description: 'IT 기획자 FlexM의 디지털 공간. 서비스 기획, AI 활용, 디지털 전환에 관한 글과 자료를 공유합니다.',
    keywords: 'FlexM, IT 기획, 서비스 기획, 디지털 전환, AI, 포트폴리오',
    canonical: '/',
  })
  const { isMobile } = useWindowWidth()
  const { posts } = useBlogPosts()
  const recentPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const { projects } = usePortfolioProjects()
  const recentPortfolio = projects.slice(0, isMobile ? 4 : 9)

  const categoryAccent: Record<string, string> = {
    '웹사이트':    'var(--c-accent)',
    '웹앱':        'var(--c-accent-mint)',
    '툴·프로그램': 'var(--c-accent-light)',
    '토이프로젝트': 'var(--c-accent)',
  }

  const cardsRef    = useScrollFadeIn()
  const projectsRef = useScrollFadeIn()
  const blogRef     = useScrollFadeIn()
  const resRef      = useScrollFadeIn()

  return (
    <div style={{ position: 'relative' }}>
      <CursorGlow />

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <ParticleCanvas />
        <div style={{ position: 'absolute', top: '10%',   left: '5%',  width: '680px', height: '680px', background: 'radial-gradient(circle, var(--c-orb1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', animation: 'float 8s ease-in-out infinite',    pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '560px', height: '560px', background: 'radial-gradient(circle, var(--c-orb2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', animation: 'floatB 10s ease-in-out infinite',   pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%',   right: '15%',width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(255,95,126,0.06) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', animation: 'float 12s ease-in-out infinite 2s', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: isMobile ? '4rem var(--page-px) 0' : '0 var(--page-px)', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'color-mix(in srgb, var(--c-accent-mint) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent-mint) 20%, transparent)', borderRadius: '999px', padding: '0.35rem 1.1rem', fontSize: '0.78rem', color: 'var(--c-accent-mint)', marginBottom: isMobile ? '1.25rem' : '2.5rem', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-accent-mint)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
            나의 디지털 공간에 오신 것을 환영합니다
          </div>

          <h1 style={{ fontSize: 'clamp(1rem,2.5vw,1.3rem)', fontWeight: 500, color: 'var(--c-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: isMobile ? '0.35rem' : '0.75rem' }}>Hello, I'm</h1>
          <h1 style={{ fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 700, lineHeight: 1.05, marginBottom: '0.5rem' }} className="text-shimmer">FlexM</h1>
          <h2 style={{ fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 700, lineHeight: 1.3, marginBottom: isMobile ? '1rem' : '1.75rem', minHeight: '1.4em' }}>
            <TypingText />
          </h2>
          <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: 'var(--c-muted)', lineHeight: 1.9, maxWidth: '480px', margin: `0 auto ${isMobile ? '1.5rem' : '5rem'}`, wordBreak: 'keep-all' }}>
            IT 기업에서 오랜 시간 서비스를 기획하고 사용해온 경험을 바탕으로,
            이 공간에 생각과 자료, 그리고 작업물들을 기록합니다.
          </p>

          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: isMobile ? '0.6rem' : '1rem', justifyContent: 'center', marginBottom: isMobile ? '1.5rem' : '4rem' }}>
            <Link to="/portfolio" className="btn-primary" style={{ textDecoration: 'none', ...(isMobile && { fontSize: '0.78rem', padding: '0.55rem 1.1rem' }) }}>포트폴리오 보기</Link>
            <Link to="/resources" className="btn-secondary" style={{ textDecoration: 'none', ...(isMobile && { fontSize: '0.78rem', padding: '0.55rem 1.1rem' }) }}>자료 둘러보기</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--c-accent)', fontFamily: 'var(--font-mono)', fontWeight: 600, opacity: 0.8 }}>Scroll</span>
            {/* 마우스 아이콘 */}
            <div style={{ width: '22px', height: '34px', borderRadius: '11px', border: '2px solid var(--c-accent)', display: 'flex', justifyContent: 'center', paddingTop: '5px', boxShadow: '0 0 10px color-mix(in srgb, var(--c-accent) 35%, transparent)', position: 'relative' }}>
              <div style={{ width: '3px', height: '7px', borderRadius: '2px', background: 'var(--c-accent)', animation: 'scrollDot 1.6s ease-in-out infinite', boxShadow: '0 0 6px var(--c-accent)' }} />
            </div>
            {/* 아래 화살표 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', animation: 'float 1.6s ease-in-out infinite' }}>
              <div style={{ width: '8px', height: '8px', borderRight: '2px solid var(--c-accent)', borderBottom: '2px solid var(--c-accent)', transform: 'rotate(45deg)', opacity: 0.9 }} />
              <div style={{ width: '8px', height: '8px', borderRight: '2px solid var(--c-accent)', borderBottom: '2px solid var(--c-accent)', transform: 'rotate(45deg)', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      </section>


      {/* ══ 네비 카드 ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 var(--page-px) 6rem' }}>
        <div ref={cardsRef} className="scroll-fade">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span className="text-gradient-all">이 공간을 탐색하세요</span>
            </h2>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>각 섹션을 클릭해서 둘러보세요</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.85rem' }}>
            {navCards.map((card, i) => (
              <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '0.85rem 1.1rem', transitionDelay: `${i * 60}ms`, height: '100%' }}>
                  {/* 썸네일 */}
                  <div style={{ width: '88px', height: '88px', borderRadius: '12px', background: card.iconBg, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', position: 'relative', overflow: 'hidden', boxShadow: `0 4px 14px ${card.glow}` }}>
                    <div style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '56px', height: '56px', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <FontAwesomeIcon icon={card.faIcon} style={{ fontSize: '1.6rem', color: 'rgba(255,255,255,0.95)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))', position: 'relative', zIndex: 1 }} />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', position: 'relative', zIndex: 1 }}>{card.tag.toUpperCase()}</span>
                  </div>
                  {/* 텍스트 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.3rem', lineHeight: 1.4 }}>{card.title}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.desc}</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--c-muted)', opacity: 0.5, flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 최근 블로그 글 ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 var(--page-px) 6rem' }}>
        <div ref={blogRef} className="scroll-fade">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 700, marginBottom: '0.75rem' }}><span className="text-gradient-all">최근 블로그 글</span></h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>IT 기획, AI, 디지털 전환에 관한 이야기</p>
            <Link to="/blog" style={{ fontSize: '0.82rem', color: 'var(--c-accent)', textDecoration: 'none', border: '1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)', padding: '0.35rem 0.9rem', borderRadius: '999px' }}>
              전체 보기 →
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: '0.875rem' }}>
              아직 작성된 글이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0.85rem' }}>
              {recentPosts.map((post, i) => (
                <Link key={post.id} to={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '1rem', padding: '0.85rem', transitionDelay: `${i * 70}ms`, overflow: 'hidden' }}>
                    {/* 썸네일 */}
                    <div style={{ width: isMobile ? '100%' : '150px', height: isMobile ? '140px' : '110px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden', position: 'relative', background: BLOG_COVER_VARIANTS[i % BLOG_COVER_VARIANTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--c-accent)' }}>
                      {post.coverImage
                        ? <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <FontAwesomeIcon icon={getIcon(post.icon)} />
                      }
                      {!post.coverImage && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 0 8px rgba(0,0,0,1), 0 0 16px rgba(0,0,0,0.8)', maxWidth: '100%' }}>{post.coverText?.trim() || post.title}</span>
                        </div>
                      )}
                    </div>
                    {/* 텍스트 */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h3>
                      <p style={{ fontSize: '0.76rem', color: 'var(--c-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>{post.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ 최근 프로젝트 ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 var(--page-px) 6rem' }}>
        <div ref={projectsRef} className="scroll-fade">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 700, marginBottom: '0.75rem' }}><span className="text-gradient-all">최근 작업물</span></h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>최근에 기획하고 참여한 프로젝트</p>
            <Link to="/portfolio" style={{ fontSize: '0.82rem', color: 'var(--c-accent)', textDecoration: 'none', border: '1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)', padding: '0.35rem 0.9rem', borderRadius: '999px' }}>
              전체 보기 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {recentPortfolio.map((p, i) => {
              const accent = categoryAccent[p.category] ?? 'var(--c-accent)'
              return (
                <Link key={p.id} to="/portfolio" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.25rem 1.5rem 1.25rem 1.75rem', transitionDelay: `${i * 70}ms`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(180deg, ${accent}, transparent)` }} />
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, color: accent }}>
                      <FontAwesomeIcon icon={getIcon(p.icon)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.25rem' }}>{p.title}</h3>
                      <p style={{ fontSize: '0.76rem', color: 'var(--c-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.desc}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--c-muted)', opacity: 0.4, flexShrink: 0 }}>→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ 최근 자료 + CTA ══ */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 var(--page-px) 8rem' }}>
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
