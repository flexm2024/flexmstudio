import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInbox } from '@fortawesome/free-solid-svg-icons'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useBlogPosts, type Post } from '../hooks/useBlogPosts'
import { useAdmin } from '../context/AdminContext'
import BlogEditor from '../components/BlogEditor'
import { getIcon } from '../lib/icons'
import { useMetaTags } from '../hooks/useMetaTags'

const COVER_VARIANTS = [
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 25%, transparent), color-mix(in srgb, var(--c-accent-mint) 12%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent-mint) 22%, transparent), color-mix(in srgb, var(--c-accent) 10%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent-light) 20%, transparent), color-mix(in srgb, var(--c-accent-mint) 10%, transparent))',
  'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 18%, transparent), color-mix(in srgb, var(--c-accent-light) 14%, transparent))',
]

export default function Blog() {
  const { posts, addPost, updatePost, deletePost } = useBlogPosts()
  const { isAdmin } = useAdmin()
  const [editTarget, setEditTarget] = useState<Post | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [activeTag, setActiveTag] = useState('전체')
  const listRef = useScrollFadeIn()

  useMetaTags({
    title: '블로그',
    description: 'IT 기획, 디지털 전환, AI 활용에 관한 FlexM의 생각과 기록.',
    keywords: 'IT 기획, 디지털 전환, AI, 서비스 기획, 블로그',
    canonical: '/blog',
  })

  const allTags = ['전체', ...Array.from(new Set(posts.flatMap(p => p.tags)))]
  const filtered = activeTag === '전체' ? posts : posts.filter(p => p.tags.includes(activeTag))

  const handleDelete = (post: Post) => {
    if (window.confirm(`"${post.title}" 글을 삭제할까요?`)) deletePost(post.id)
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>

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

      {/* 태그 필터 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {allTags.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)} className={`filter-btn${activeTag === tag ? ' active' : ''}`}>{tag}</button>
        ))}
      </div>

      {/* 포스트 그리드 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--c-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--c-muted)' }}>
            <FontAwesomeIcon icon={faInbox} />
          </div>
          <p style={{ fontSize: '0.9rem' }}>게시물이 없습니다.</p>
          {isAdmin && <button onClick={() => { setEditTarget(null); setShowEditor(true) }} className="btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>첫 글 작성하기</button>}
        </div>
      ) : (
        <div ref={listRef} className="scroll-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((post, i) => (
            <article key={post.id} className="card" style={{ display: 'flex', flexDirection: 'column', transitionDelay: `${i * 50}ms` }}>
              {/* 커버 */}
              <div style={{ height: '130px', background: COVER_VARIANTS[i % COVER_VARIANTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0, position: 'relative', color: 'var(--c-accent)', overflow: 'hidden' }}>
                {post.coverImage
                  ? <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <FontAwesomeIcon icon={getIcon(post.icon)} />
                }
                {isAdmin && (
                  <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', display: 'flex', gap: '0.35rem' }}>
                    <button onClick={() => { setEditTarget(post); setShowEditor(true) }}
                      style={{ fontSize: '0.68rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      수정
                    </button>
                    <button onClick={() => handleDelete(post)}
                      style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      삭제
                    </button>
                  </div>
                )}
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* 태그 */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {post.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
                </div>

                {/* 제목 */}
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.5rem', lineHeight: 1.45, fontFamily: 'var(--font-display)' }}>
                  {post.title}
                </h2>

                {/* 요약 */}
                <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', lineHeight: 1.75, flex: 1, marginBottom: '1.1rem' }}>
                  {post.excerpt}
                </p>

                {/* 하단 메타 + 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>{post.date}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{post.readMin}분 읽기</span>
                  </div>
                  <Link to={`/blog/${post.slug || post.id}`} className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.75rem', padding: '0.32rem 0.85rem' }}>
                    읽기 →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
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
