import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInbox } from '@fortawesome/free-solid-svg-icons'
import { useBlogPosts, type Post } from '../hooks/useBlogPosts'
import { useAdmin } from '../context/AdminContext'
import { useWindowWidth } from '../hooks/useWindowWidth'
import BlogEditor from '../components/BlogEditor'
import { getIcon } from '../lib/icons'
import { useMetaTags } from '../hooks/useMetaTags'

const COVER_VARIANTS = [
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 25%, transparent), color-mix(in srgb, var(--c-accent-mint) 12%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent-mint) 22%, transparent), color-mix(in srgb, var(--c-accent) 10%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent-light) 20%, transparent), color-mix(in srgb, var(--c-accent-mint) 10%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 18%, transparent), color-mix(in srgb, var(--c-accent-light) 14%, transparent))',
]

function AdminButtons({ onEdit, onDelete }: { post: Post; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); onEdit() }}
        style={{ fontSize: '0.68rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>
        수정
      </button>
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete() }}
        style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>
        삭제
      </button>
    </div>
  )
}

const GRID_PER_PAGE = 9
const MOBILE_PER_PAGE = 8

export default function Blog() {
  const { posts, addPost, updatePost, deletePost } = useBlogPosts()
  const { isAdmin } = useAdmin()
  const { isMobile } = useWindowWidth()
  const [editTarget, setEditTarget] = useState<Post | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [activeCategory, setActiveCategory] = useState('전체')
  const [gridPage, setGridPage] = useState(1)
  const [mobileCount, setMobileCount] = useState(MOBILE_PER_PAGE)

  useMetaTags({
    title: '블로그',
    description: 'IT 기획, 디지털 전환, AI 활용에 관한 FlexM의 생각과 기록.',
    keywords: 'IT 기획, 디지털 전환, AI, 서비스 기획, 블로그',
    canonical: '/blog',
  })

  const allCategories = ['전체', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean) as string[]))]
  const filtered = activeCategory === '전체' ? posts : posts.filter(p => p.category === activeCategory)

  const handleDelete = (post: Post) => {
    if (window.confirm(`"${post.title}" 글을 삭제할까요?`)) deletePost(post.id)
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setGridPage(1)
    setMobileCount(MOBILE_PER_PAGE)
  }

  const featured = filtered[0]
  const sideList = filtered.slice(1, 4)
  const gridStart = 4 + (gridPage - 1) * GRID_PER_PAGE
  const gridPosts = filtered.slice(gridStart, gridStart + GRID_PER_PAGE)
  const totalGridPages = Math.ceil(Math.max(0, filtered.length - 4) / GRID_PER_PAGE)

  const mobileVisible = filtered.slice(0, mobileCount)
  const hasMobileMore = filtered.length > mobileCount

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem var(--page-px)' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0' }}>
        <div>
          <h1 className="section-title">블로그</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            IT 기획, 디지털 전환, 생산성에 관한 글들
          </p>
          <div className="accent-bar" />
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--c-accent-mint)', fontFamily: 'var(--font-mono)' }}>● 관리자 모드</span>
            <button onClick={() => { setEditTarget(null); setShowEditor(true) }} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1.2rem' }}>
              + 새 글 쓰기
            </button>
          </div>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => handleCategoryChange(cat)} className={`filter-btn${activeCategory === cat ? ' active' : ''}`}>{cat}</button>
        ))}
      </div>

      {/* 포스트 목록 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--c-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <FontAwesomeIcon icon={faInbox} />
          </div>
          <p style={{ fontSize: '0.9rem' }}>게시물이 없습니다.</p>
          {isAdmin && <button onClick={() => { setEditTarget(null); setShowEditor(true) }} className="btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>첫 글 작성하기</button>}
        </div>
      ) : isMobile ? (
        /* ── 모바일: 홈 스타일 카드 ── */
        <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
          {mobileVisible.map((post, i) => (
            <Link key={post.id} to={`/blog/${post.slug || post.id}`} style={{ textDecoration: 'none' }}>
              <article className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0', padding: '0.85rem', overflow: 'hidden' }}>
                {/* 썸네일: 풀 width */}
                <div style={{ width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', position: 'relative', background: COVER_VARIANTS[i % COVER_VARIANTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'var(--c-accent)', marginBottom: '0.85rem' }}>
                  {post.coverImage
                    ? <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <FontAwesomeIcon icon={getIcon(post.icon)} />
                  }
                  {!post.coverImage && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
                      <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 0 8px rgba(0,0,0,1), 0 0 16px rgba(0,0,0,0.8)', maxWidth: '100%' }}>{post.coverText?.trim() || post.title}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.35rem', zIndex: 1 }}>
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setEditTarget(post); setShowEditor(true) }}
                        style={{ fontSize: '0.68rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>수정</button>
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(post) }}
                        style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>삭제</button>
                    </div>
                  )}
                </div>
                {/* 텍스트 */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h2>
                  <p style={{ fontSize: '0.76rem', color: 'var(--c-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                  <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>{post.date}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
        {hasMobileMore && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => setMobileCount(c => c + MOBILE_PER_PAGE)}
              style={{ fontSize: '0.85rem', color: 'var(--c-accent)', background: 'transparent', border: '1px solid color-mix(in srgb, var(--c-accent) 40%, transparent)', borderRadius: '8px', padding: '0.6rem 1.8rem', cursor: 'pointer', fontWeight: 600 }}
            >
              더 보기 ({filtered.length - mobileCount}개 남음)
            </button>
          </div>
        )}
        </>
      ) : (
        /* ── PC: featured + side + grid ── */
        <>
          {/* 상단: featured (좌) + side list (우) */}
          <div style={{ display: 'grid', gridTemplateColumns: sideList.length > 0 ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: gridPosts.length > 0 ? '3rem' : 0, alignItems: 'stretch' }}>

            {/* Featured */}
            {featured && (
              <Link to={`/blog/${featured.slug || featured.id}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
                <article className="card" style={{ overflow: 'hidden', padding: 0, width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ flex: 1, minHeight: '220px', overflow: 'hidden', position: 'relative', background: COVER_VARIANTS[0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: 'var(--c-accent)' }}>
                    {featured.coverImage
                      ? <img src={featured.coverImage} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <FontAwesomeIcon icon={getIcon(featured.icon)} />
                    }
                    {isAdmin && (
                      <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', display: 'flex', gap: '0.35rem', zIndex: 1 }}>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setEditTarget(featured); setShowEditor(true) }}
                          style={{ fontSize: '0.68rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>수정</button>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(featured) }}
                          style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>삭제</button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {featured.tags.map(tag => <span key={tag} className="badge">#{tag}</span>)}
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.35, marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>{featured.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', lineHeight: 1.7, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.excerpt}</p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', marginTop: '1rem' }}>{featured.date}</span>
                  </div>
                </article>
              </Link>
            )}

            {/* Side list */}
            {sideList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sideList.map((post, i) => (
                  <Link key={post.id} to={`/blog/${post.slug || post.id}`} style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
                    <article className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem', overflow: 'hidden', width: '100%' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '8px', flexShrink: 0, overflow: 'hidden', position: 'relative', background: COVER_VARIANTS[(i + 1) % COVER_VARIANTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'var(--c-accent)' }}>
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
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                        <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>{post.date}</span>
                      </div>
                      {isAdmin && <AdminButtons post={post} onEdit={() => { setEditTarget(post); setShowEditor(true) }} onDelete={() => handleDelete(post)} />}
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 하단: 지난 블로그 글 3열 그리드 */}
          {gridPosts.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '3px', height: '1.1rem', background: 'var(--c-accent)', borderRadius: '2px' }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)' }}>지난 블로그 글</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {gridPosts.map((post, i) => (
                  <Link key={post.id} to={`/blog/${post.slug || post.id}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
                    <article className="card" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
                      {/* 커버 이미지 */}
                      <div style={{ height: '200px', flexShrink: 0, overflow: 'hidden', position: 'relative', background: COVER_VARIANTS[i % COVER_VARIANTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--c-accent)' }}>
                        {post.coverImage
                          ? <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <FontAwesomeIcon icon={getIcon(post.icon)} />
                        }
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem 0.65rem', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {post.tags.slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px', padding: '0.1rem 0.45rem', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 600 }}>{tag}</span>
                          ))}
                        </div>
                        {isAdmin && (
                          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.3rem', zIndex: 1 }}>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setEditTarget(post); setShowEditor(true) }}
                              style={{ fontSize: '0.65rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '5px', padding: '0.15rem 0.45rem', cursor: 'pointer', fontWeight: 600 }}>수정</button>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(post) }}
                              style={{ fontSize: '0.65rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '5px', padding: '0.15rem 0.45rem', cursor: 'pointer', fontWeight: 600 }}>삭제</button>
                          </div>
                        )}
                      </div>
                      {/* 텍스트 영역 */}
                      <div style={{ padding: '1rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{post.date}</span>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                        <span style={{ fontSize: '0.78rem', color: 'var(--c-accent)', fontWeight: 600, marginTop: '0.25rem' }}>더 읽어보기 →</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              {/* 페이지네이션 */}
              {totalGridPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => setGridPage(p => p - 1)}
                    disabled={gridPage === 1}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', borderRadius: '7px', border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: gridPage === 1 ? 'var(--c-muted)' : 'var(--c-text)', cursor: gridPage === 1 ? 'default' : 'pointer', opacity: gridPage === 1 ? 0.4 : 1 }}
                  >← 이전</button>
                  {Array.from({ length: totalGridPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setGridPage(p)}
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', borderRadius: '7px', border: p === gridPage ? '1px solid var(--c-accent)' : '1px solid var(--c-border)', background: p === gridPage ? 'color-mix(in srgb, var(--c-accent) 15%, transparent)' : 'var(--c-surface)', color: p === gridPage ? 'var(--c-accent)' : 'var(--c-text)', cursor: 'pointer', fontWeight: p === gridPage ? 700 : 400 }}
                    >{p}</button>
                  ))}
                  <button
                    onClick={() => setGridPage(p => p + 1)}
                    disabled={gridPage === totalGridPages}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', borderRadius: '7px', border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: gridPage === totalGridPages ? 'var(--c-muted)' : 'var(--c-text)', cursor: gridPage === totalGridPages ? 'default' : 'pointer', opacity: gridPage === totalGridPages ? 0.4 : 1 }}
                  >다음 →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showEditor && (
        <BlogEditor
          post={editTarget}
          onSave={draft => {
            if (editTarget) updatePost(editTarget.id, draft)
            else addPost(draft)
            setShowEditor(false)
          }}
          onClose={() => setShowEditor(false)}
        />
      )}

    </div>
  )
}
