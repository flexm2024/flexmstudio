import { useState, useRef, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faCode, faLink } from '@fortawesome/free-solid-svg-icons'
import { generateSlug } from '../lib/seo'
import { getIcon, BLOG_ICON_PRESETS } from '../lib/icons'
import { renderMarkdown } from '../lib/renderMarkdown'
import RichTextEditor from './RichTextEditor'
import type { Post } from '../hooks/useBlogPosts'

type ContentType = 'richtext' | 'markdown' | 'html'
type Draft = Omit<Post, 'id' | 'date' | 'readMin'>

interface Props {
  post: Post | null
  onSave: (draft: Draft) => void
  onClose: () => void
}

const MD_PLACEHOLDER = `# 글 제목

본문 내용을 마크다운으로 작성하세요.

## 소제목

- 항목 1
- 항목 2

> 인용구

\`\`\`
코드 블록
\`\`\`

**굵게** *기울임* \`인라인 코드\``

const HTML_PLACEHOLDER = `<h1>글 제목</h1>

<p>본문 내용을 HTML로 작성하세요.</p>

<h2>소제목</h2>

<ul>
  <li>항목 1</li>
  <li>항목 2</li>
</ul>

<blockquote>인용구</blockquote>

<p><strong>굵게</strong> <em>기울임</em></p>`

const MODE_TABS: { key: ContentType; label: string }[] = [
  { key: 'richtext',  label: '글작성' },
  { key: 'markdown',  label: 'Markdown' },
  { key: 'html',      label: 'HTML' },
]

export default function BlogEditor({ post, onSave, onClose }: Props) {
  const [icon, setIcon] = useState(post?.icon ?? 'pen-to-square')
  const [coverImage, setCoverImage] = useState<string | undefined>(post?.coverImage)
  const [title, setTitle] = useState(post?.title ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [tagsRaw, setTagsRaw] = useState(post?.tags.join(', ') ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [contentType, setContentType] = useState<ContentType>(post?.contentType ?? 'richtext')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showIconPicker, setShowIconPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleModeChange = (type: ContentType) => {
    setContentType(type)
    setShowPreview(false)
  }

  const insertMarkdown = (before: string, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const next = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(next)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = '제목을 입력해 주세요.'
    if (!excerpt.trim()) e.excerpt = '요약을 입력해 주세요.'
    if (!content.trim() && contentType === 'richtext') e.content = '내용을 입력해 주세요.'
    if (!content.trim() && contentType !== 'richtext') e.content = '내용을 입력해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!validate()) return
    onSave({
      icon, coverImage,
      title: title.trim(),
      excerpt: excerpt.trim(),
      slug: slug.trim() || generateSlug(title.trim()),
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      content: content.trim(),
      contentType,
    })
  }

  const inputStyle = (key: string): React.CSSProperties => ({
    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
    background: 'var(--c-surface2)', border: `1px solid ${errors[key] ? 'var(--c-danger)' : 'var(--c-border)'}`,
    color: 'var(--c-text)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'var(--font-sans)', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  })
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, key: string) => {
    if (!errors[key]) e.currentTarget.style.borderColor = 'var(--c-accent)'
  }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, key: string) => {
    if (!errors[key]) e.currentTarget.style.borderColor = 'var(--c-border)'
  }

  const showSplitPreview = showPreview && contentType !== 'richtext'
  const modalWidth = showSplitPreview ? '1140px' : '720px'

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '20px', width: '100%', maxWidth: modalWidth, maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'modalIn 0.25s ease', transition: 'max-width 0.25s ease' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
            {post ? '글 수정' : '새 글 쓰기'}
          </h2>
          <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* 커버 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              커버 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(이미지 업로드 또는 아이콘 선택)</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <label style={{ flexShrink: 0, width: '100px', height: '80px', borderRadius: '10px', border: `2px dashed ${coverImage ? 'var(--c-accent)' : 'var(--c-border)'}`, background: 'var(--c-surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {coverImage
                  ? <img src={coverImage} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: '0.65rem', lineHeight: 1.6 }}><div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>+</div>이미지 업로드</div>
                }
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {coverImage && (
                  <button type="button" onClick={() => setCoverImage(undefined)}
                    style={{ fontSize: '0.72rem', color: 'var(--c-danger)', background: 'transparent', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                    이미지 제거
                  </button>
                )}
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShowIconPicker(p => !p)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: coverImage ? 'var(--c-muted)' : 'var(--c-accent)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: coverImage ? 0.5 : 1 }}>
                    <FontAwesomeIcon icon={getIcon(icon)} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>아이콘 선택 ▾</span>
                  </button>
                  {showIconPicker && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: '280px' }}>
                      {BLOG_ICON_PRESETS.map(preset => (
                        <button key={preset.key} type="button" title={preset.label}
                          onClick={() => { setIcon(preset.key); setShowIconPicker(false) }}
                          style={{ padding: '0.6rem', borderRadius: '8px', border: preset.key === icon ? '2px solid var(--c-accent)' : '2px solid transparent', background: preset.key === icon ? 'color-mix(in srgb, var(--c-accent) 12%, transparent)' : 'transparent', cursor: 'pointer', color: preset.key === icon ? 'var(--c-accent)' : 'var(--c-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                          <FontAwesomeIcon icon={getIcon(preset.key)} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--c-muted)' }}>이미지 업로드 시 아이콘 대신 표시됩니다</p>
              </div>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: errors.title ? 'var(--c-danger)' : 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>제목</label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(v => ({ ...v, title: '' })) }}
              placeholder="글 제목을 입력하세요" style={inputStyle('title')}
              onFocus={e => focusStyle(e, 'title')} onBlur={e => blurStyle(e, 'title')} />
            {errors.title && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.title}</p>}
          </div>

          {/* 요약 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: errors.excerpt ? 'var(--c-danger)' : 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>요약 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(카드에 표시됩니다)</span></label>
            <input type="text" value={excerpt} onChange={e => { setExcerpt(e.target.value); setErrors(v => ({ ...v, excerpt: '' })) }}
              placeholder="한두 문장으로 글을 요약해 주세요" style={inputStyle('excerpt')}
              onFocus={e => focusStyle(e, 'excerpt')} onBlur={e => blurStyle(e, 'excerpt')} />
            {errors.excerpt && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.excerpt}</p>}
          </div>

          {/* 태그 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>태그 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(쉼표로 구분)</span></label>
            <input type="text" value={tagsRaw} onChange={e => setTagsRaw(e.target.value)}
              placeholder="기획, AI, 생산성" style={inputStyle('')}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'} />
          </div>

          {/* 슬러그 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              URL 슬러그 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(비워두면 제목으로 자동 생성)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s' }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
              onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}>
              <span style={{ padding: '0.7rem 0.75rem 0.7rem 1rem', fontSize: '0.75rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', borderRight: '1px solid var(--c-border)', background: 'color-mix(in srgb, var(--c-surface) 40%, transparent)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FontAwesomeIcon icon={faLink} style={{ fontSize: '0.65rem' }} /> /blog/
              </span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.replace(/\s+/g, '-').replace(/[^\w가-힣-]/g, ''))}
                onBlur={() => { if (!slug && title) setSlug(generateSlug(title)) }}
                placeholder={title ? generateSlug(title) : '슬러그-입력'}
                style={{ flex: 1, padding: '0.7rem 1rem', background: 'transparent', border: 'none', color: 'var(--c-text)', fontSize: '0.82rem', outline: 'none', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          {/* 본문 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* 모드 탭 + 미리보기 토글 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: errors.content ? 'var(--c-danger)' : 'var(--c-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>본문</label>

                {/* 3탭 */}
                <div style={{ display: 'flex', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '2px', gap: '2px' }}>
                  {MODE_TABS.map(tab => (
                    <button key={tab.key} type="button" onClick={() => handleModeChange(tab.key)}
                      style={{ padding: '0.22rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                        background: contentType === tab.key ? 'var(--c-accent)' : 'transparent',
                        color: contentType === tab.key ? '#fff' : 'var(--c-muted)',
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 마크다운 단축 버튼 & 미리보기 (richtext 아닐 때만) */}
              {contentType !== 'richtext' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {contentType === 'markdown' && !showPreview && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[
                        { label: 'B', action: () => insertMarkdown('**', '**'), title: '굵게' },
                        { label: 'I', action: () => insertMarkdown('*', '*'), title: '기울임', style: { fontStyle: 'italic' as const } },
                        { label: '`', action: () => insertMarkdown('`', '`'), title: '인라인 코드' },
                        { label: 'H2', action: () => insertMarkdown('## '), title: '소제목' },
                        { label: '—', action: () => insertMarkdown('- '), title: '목록' },
                      ].map(btn => (
                        <button key={btn.label} type="button" onClick={btn.action} title={btn.title}
                          style={{ padding: '0.2rem 0.45rem', borderRadius: '5px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-muted)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', ...(btn.style ?? {}) }}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {contentType === 'html' && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FontAwesomeIcon icon={faCode} style={{ color: 'var(--c-accent)' }} /> HTML 태그로 작성
                    </span>
                  )}
                  <button type="button" onClick={() => setShowPreview(p => !p)}
                    title={showPreview ? '미리보기 닫기' : '미리보기 열기'}
                    style={{ padding: '0.22rem 0.6rem', borderRadius: '6px', background: showPreview ? 'color-mix(in srgb, var(--c-accent) 12%, transparent)' : 'var(--c-surface2)', border: `1px solid ${showPreview ? 'color-mix(in srgb, var(--c-accent) 35%, transparent)' : 'var(--c-border)'}`, color: showPreview ? 'var(--c-accent)' : 'var(--c-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s' }}>
                    <FontAwesomeIcon icon={showPreview ? faEyeSlash : faEye} />
                    미리보기
                  </button>
                </div>
              )}
            </div>

            {/* 에디터 + 미리보기 */}
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {contentType === 'richtext' ? (
                  <>
                    <RichTextEditor
                      key="richtext"
                      value={content}
                      onChange={val => { setContent(val); setErrors(v => ({ ...v, content: '' })) }}
                      hasError={!!errors.content}
                    />
                    {errors.content && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.content}</p>}
                  </>
                ) : (
                  <>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={e => { setContent(e.target.value); setErrors(v => ({ ...v, content: '' })) }}
                      placeholder={contentType === 'markdown' ? MD_PLACEHOLDER : HTML_PLACEHOLDER}
                      rows={16}
                      style={{ ...inputStyle('content'), resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.7, flex: 1 }}
                      onFocus={e => focusStyle(e, 'content')} onBlur={e => blurStyle(e, 'content')}
                    />
                    {errors.content && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.content}</p>}
                  </>
                )}
              </div>

              {/* 분할 미리보기 (markdown / html만) */}
              {showSplitPreview && (
                <div style={{ flex: 1, borderRadius: '10px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', padding: '1rem 1.25rem', overflowY: 'auto', fontSize: '0.875rem' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--c-border)' }}>
                    PREVIEW — {contentType === 'markdown' ? 'Markdown' : 'HTML'}
                  </p>
                  {content.trim()
                    ? contentType === 'markdown'
                      ? <div>{renderMarkdown(content)}</div>
                      : <div dangerouslySetInnerHTML={{ __html: content }} style={{ color: 'var(--c-text)', lineHeight: 1.8 }} />
                    : <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>내용을 입력하면 미리보기가 표시됩니다.</p>
                  }
                </div>
              )}
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--c-border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>취소</button>
          <button type="button" onClick={() => handleSubmit()} className="btn-primary" style={{ flex: 2 }}>
            {post ? '수정 저장' : '발행하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
