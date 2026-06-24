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


function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}. ${m}. ${d}`
}

function injectPostDate(html: string, date: string): string {
  return html.replace(/✦\s*\d{4}년\s*기준/g, `✦ ${formatDate(date)}`)
}

function isFullHtmlDoc(content: string): boolean {
  const head = content.slice(0, 500)
  return /^\s*<!DOCTYPE/i.test(head) || /^\s*<html\b/i.test(head) || /<style[\s>]/i.test(head)
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { posts, serverLoaded, updatePost } = useBlogPosts()
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()
  const [showEditor, setShowEditor] = useState(false)

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
    title: serverLoaded ? '글을 찾을 수 없음' : '로딩 중...',
    noIndex: serverLoaded,
  })

  if (!post) {
    if (!serverLoaded) {
      return (
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem var(--page-px)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>불러오는 중...</p>
        </div>
      )
    }
    return (
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem var(--page-px)', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--c-muted)' }}><FontAwesomeIcon icon={faInbox} /></div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>글을 찾을 수 없습니다</h1>
        <p style={{ color: 'var(--c-muted)', marginBottom: '2rem' }}>삭제되었거나 존재하지 않는 글입니다.</p>
        <Link to="/blog" className="btn-primary" style={{ textDecoration: 'none' }}>← 블로그로 돌아가기</Link>
      </div>
    )
  }

  /* ── HTML 타입 또는 HTML 전문서인 richtext: DOM에 직접 렌더링 (SEO 색인 가능) ── */
  if (post.contentType === 'html' || (post.contentType === 'richtext' && isFullHtmlDoc(post.content))) {
    return (
      <>
        {/* 상단 네비 */}
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem var(--page-px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/blog"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--c-muted)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >
            ← 블로그 목록
          </Link>
          {isAdmin && (
            <button onClick={() => setShowEditor(true)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
              수정하기
            </button>
          )}
        </div>

        {/* 커버 이미지 (있을 때만) */}
        {post.coverImage && (
          <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 var(--page-px) 1rem' }}>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--c-border)' }}>
              <img src={post.coverImage} alt={post.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        )}

        {/* HTML 콘텐츠 — DOM에 직접 삽입해 Googlebot이 텍스트를 읽을 수 있게 함 */}
        <div dangerouslySetInnerHTML={{ __html: injectPostDate(post.content, post.date) }} />

        {showEditor && (
          <BlogEditor
            post={post}
            onSave={draft => { updatePost(post.id, draft); setShowEditor(false); navigate(`/blog/${draft.slug || post.slug}`) }}
            onClose={() => setShowEditor(false)}
          />
        )}
      </>
    )
  }

  /* ── richtext 타입: HTML 모드와 동일 구조 (nav + 커버 + 본문) ── */
  if (post.contentType === 'richtext') {
    return (
      <>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem var(--page-px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/blog"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--c-muted)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >
            ← 블로그 목록
          </Link>
          {isAdmin && (
            <button onClick={() => setShowEditor(true)} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
              수정하기
            </button>
          )}
        </div>

        {post.coverImage && (
          <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 var(--page-px) 1rem' }}>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--c-border)' }}>
              <img src={post.coverImage} alt={post.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        )}

        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 var(--page-px) 4rem' }}>
          <div className="richtext-body" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {showEditor && (
          <BlogEditor
            post={post}
            onSave={draft => { updatePost(post.id, draft); setShowEditor(false); navigate(`/blog/${draft.slug || post.slug}`) }}
            onClose={() => setShowEditor(false)}
          />
        )}
      </>
    )
  }

  /* ── markdown 타입: 래퍼 구조 유지 ── */
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '5rem var(--page-px)' }}>

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

      <article style={{ overflowX: 'hidden' }}>
        <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '2.5rem', border: '1px solid var(--c-border)' }}>
          {post.coverImage
            ? <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '500px', objectFit: 'cover', display: 'block' }} />
            : <div style={{ height: '200px', background: 'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 20%, transparent), color-mix(in srgb, var(--c-accent-mint) 12%, transparent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: 'var(--c-accent)' }}>
                <FontAwesomeIcon icon={getIcon(post.icon)} />
              </div>
          }
        </div>

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

        <div>{renderMarkdown(post.content)}</div>

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
