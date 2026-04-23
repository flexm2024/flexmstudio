import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInbox } from '@fortawesome/free-solid-svg-icons'
import { useBlogPosts, type Post } from '../hooks/useBlogPosts'
import { useAdmin } from '../context/AdminContext'
import BlogEditor from '../components/BlogEditor'
import { getIcon } from '../lib/icons'
import { renderMarkdown } from '../lib/renderMarkdown'
import { useMetaTags } from '../hooks/useMetaTags'
import { SITE_URL, SITE_NAME } from '../lib/seo'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { posts, updatePost } = useBlogPosts()
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()
  const [showEditor, setShowEditor] = useState(false)

  // slug 또는 id(하위호환) 로 조회
  const post: Post | undefined = useMemo(
    () => posts.find(p => p.slug === slug || p.id === slug),
    [posts, slug]
  )

  useMetaTags(post ? {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    ogType: 'article',
    ogImage: post.coverImage ?? `${SITE_URL}/character.png`,
    canonical: `/blog/${post.slug}`,
    publishedTime: post.date,
    author: SITE_NAME,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.date,
      author: { '@type': 'Person', name: 'FlexM', url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      url: `${SITE_URL}/blog/${post.slug}`,
      keywords: post.tags.join(', '),
      ...(post.coverImage ? { image: post.coverImage } : {}),
    },
  } : {
    title: '글을 찾을 수 없음',
    noIndex: true,
  })

  if (!post) {
    return (
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--c-muted)' }}><FontAwesomeIcon icon={faInbox} /></div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>글을 찾을 수 없습니다</h1>
        <p style={{ color: 'var(--c-muted)', marginBottom: '2rem' }}>삭제되었거나 존재하지 않는 글입니다.</p>
        <Link to="/blog" className="btn-primary" style={{ textDecoration: 'none' }}>← 블로그로 돌아가기</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>

      {/* 상단 네비 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
        <Link to="/blog" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--c-muted)', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--c-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>
          ← 블로그 목록
        </Link>
        {isAdmin && (
          <button onClick={() => setShowEditor(true)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
            수정하기
          </button>
        )}
      </div>

      {/* 본문 컨테이너 */}
      <article style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* 커버 */}
        <div style={{ height: '200px', borderRadius: '20px', background: 'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 20%, transparent), color-mix(in srgb, var(--c-accent-mint) 12%, transparent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', marginBottom: '2.5rem', border: '1px solid var(--c-border)', color: 'var(--c-accent)' }}>
          <FontAwesomeIcon icon={getIcon(post.icon)} />
        </div>

        {/* 메타 정보 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {post.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
        </div>

        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: 'var(--c-text)', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--c-border)' }}>
          <span>{post.date}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>읽는 시간 {post.readMin}분</span>
        </div>

        {/* 본문 */}
        <div>
          {post.contentType === 'richtext' || post.contentType === 'html'
            ? <div className="richtext-body" dangerouslySetInnerHTML={{ __html: post.content }} />
            : renderMarkdown(post.content)
          }
        </div>

        {/* 하단 네비 */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/blog" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            ← 목록으로
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {post.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
        </div>
      </article>

      {showEditor && (
        <BlogEditor
          post={post}
          onSave={draft => { updatePost(post.id, draft); setShowEditor(false); navigate(`/blog/${draft.slug || post.slug}`) }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
