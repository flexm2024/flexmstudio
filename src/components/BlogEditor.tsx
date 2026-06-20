import { useState, useRef, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faCode, faLink } from '@fortawesome/free-solid-svg-icons'
import { generateSlug } from '../lib/seo'
import { getIcon, BLOG_ICON_PRESETS } from '../lib/icons'
import { renderMarkdown } from '../lib/renderMarkdown'
import RichTextEditor from './RichTextEditor'
import CoverImageMaker from './CoverImageMaker'
import type { Post } from '../hooks/useBlogPosts'

type ContentType = 'richtext' | 'markdown' | 'html'
type Draft = Omit<Post, 'id' | 'date' | 'readMin'>

const IFRAME_FONT = '<link id="__fe_font__" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/Paperlogy/Paperlogy.css">'
const IFRAME_SCRIPT = `<script id="__fe_dm__">document.designMode="on";document.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();});});</script>`

function isHtmlTemplate(c: string): boolean {
  const h = c.slice(0, 500)
  return /^\s*<!DOCTYPE/i.test(h) || /^\s*<html\b/i.test(h) || /<style[\s>]/i.test(h)
}

function buildEditableSrcDoc(html: string): string {
  let s = html.includes('<head>') ? html.replace('<head>', `<head>${IFRAME_FONT}`) : IFRAME_FONT + html
  return s.includes('</body>') ? s.replace('</body>', `${IFRAME_SCRIPT}</body>`) : s + IFRAME_SCRIPT
}

function cleanEditedHtml(html: string): string {
  return html
    .replace(/<link[^>]+id="__fe_font__"[^>]*\/?>/gi, '')
    .replace(/<script[^>]+id="__fe_dm__"[^>]*>[\s\S]*?<\/script>/gi, '')
}

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

function extractMeta(content: string, contentType: ContentType) {
  if (contentType === 'html' || contentType === 'richtext') {
    const titleMatch = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    const pMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '제목 없음'
    const excerpt = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 120) : ''
    return { title, excerpt }
  }
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const bodyLines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('>') && !l.startsWith('-'))
  const title = titleMatch ? titleMatch[1].trim() : '제목 없음'
  const excerpt = bodyLines[0]?.replace(/[*_`]/g, '').trim().slice(0, 120) ?? ''
  return { title, excerpt }
}

export default function BlogEditor({ post, onSave, onClose }: Props) {
  const [icon, setIcon] = useState(post?.icon ?? 'pen-to-square')
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '')
  const [coverText, setCoverText] = useState(post?.coverText ?? '')
  const [category, setCategory] = useState(post?.category ?? '')
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [content, setContent] = useState(post?.content ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [contentType, setContentType] = useState<ContentType>(post?.contentType ?? 'richtext')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [loadedFileName, setLoadedFileName] = useState('')
  const [localImgRefs, setLocalImgRefs] = useState<{ src: string; name: string }[]>([])
  const [showCoverMaker, setShowCoverMaker] = useState(false)
  const [editSrcDoc, setEditSrcDoc] = useState<string | null>(() =>
    (post?.contentType === 'richtext' || post?.contentType === 'html') && isHtmlTemplate(post?.content ?? '')
      ? buildEditableSrcDoc(post!.content)
      : null
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const htmlFileRef = useRef<HTMLInputElement>(null)
  const iframeEditRef = useRef<HTMLIFrameElement>(null)

  const loadHtmlFile = (file: File) => {
    if (!file.name.endsWith('.html') && file.type !== 'text/html') return
    const reader = new FileReader()
    reader.onload = () => {
      const html = reader.result as string
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const titleText = h1Match
        ? h1Match[1].replace(/<[^>]+>/g, '').trim()
        : file.name.replace(/\.html?$/, '')
      setSlug(generateSlug(titleText))
      setContent(html)
      setContentType('html')
      setLoadedFileName(file.name)
      setErrors({})
      // 로컬 이미지 경로 감지
      const srcs = [...html.matchAll(/src=["']([^"']+)["']/gi)]
        .map(m => m[1])
        .filter(s => !s.startsWith('http') && !s.startsWith('data:') && !s.startsWith('//'))
        .filter((s, i, a) => a.indexOf(s) === i)
      setLocalImgRefs(srcs.map(s => ({ src: s, name: s.split(/[/\\]/).pop() ?? s })))
    }
    reader.readAsText(file, 'UTF-8')
  }

  const replaceLocalImage = (originalSrc: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const escaped = originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      setContent(prev => prev.replace(new RegExp(escaped, 'g'), base64))
      setLocalImgRefs(prev => prev.filter(r => r.src !== originalSrc))
    }
    reader.readAsDataURL(file)
  }

  const handleModalDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if ([...e.dataTransfer.items].some(i => i.kind === 'file')) setIsDragging(true)
  }
  const handleModalDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadHtmlFile(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const getIframeContent = (): string => {
    const doc = iframeEditRef.current?.contentDocument
    if (!doc) return content
    return cleanEditedHtml(doc.documentElement.outerHTML)
  }

  const handleModeChange = (type: ContentType) => {
    // 글작성 iframe 모드에서 빠져나갈 때 content 동기화
    if (contentType === 'richtext' && editSrcDoc) {
      const synced = getIframeContent()
      setContent(synced)
    }
    // 글작성 탭 전환 시 HTML 템플릿이면 iframe 편집 모드 활성화
    if (type === 'richtext') {
      const src = isHtmlTemplate(content) ? buildEditableSrcDoc(content) : null
      setEditSrcDoc(src)
    } else {
      setEditSrcDoc(null)
    }
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

  const handleIframeImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const doc = iframeEditRef.current?.contentDocument
      if (!doc) return
      const img = doc.createElement('img')
      img.src = reader.result as string
      img.style.cssText = 'max-width:100%;border-radius:8px;margin:1rem auto;display:block;'
      const sel = doc.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        range.collapse(false)
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      } else {
        doc.body.appendChild(img)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().replace(/,$/, '')
      if (val && !tags.includes(val)) setTags(prev => [...prev, val])
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    // iframe 편집 모드면 iframe에서 최종 콘텐츠 추출
    let finalContent = content
    let finalType: ContentType = contentType
    if (contentType === 'richtext' && editSrcDoc) {
      finalContent = getIframeContent()
      finalType = 'html' // HTML 구조 보존을 위해 html 타입으로 저장
    }
    if (!finalContent.trim()) { setErrors({ content: '내용을 입력해 주세요.' }); return }
    const trimmed = finalContent.trim()
    const { title, excerpt } = extractMeta(trimmed, finalType)
    onSave({
      icon, coverImage,
      coverText: coverText.trim(),
      category: category.trim() || undefined,
      title,
      excerpt,
      slug: slug.trim() || generateSlug(title),
      tags,
      content: trimmed,
      contentType: finalType,
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

  return createPortal(
    <>
      {showCoverMaker && (
        <CoverImageMaker
          initialTitle=""
          onApply={(dataUrl) => setCoverImage(dataUrl)}
          onClose={() => setShowCoverMaker(false)}
        />
      )}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div
        onClick={e => e.stopPropagation()}
        onDragOver={handleModalDragOver}
        onDragLeave={handleModalDragLeave}
        onDrop={handleModalDrop}
        style={{ background: 'var(--c-surface)', border: `1px solid ${isDragging ? 'var(--c-accent)' : 'var(--c-border)'}`, borderRadius: '20px', width: '100%', maxWidth: modalWidth, maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'modalIn 0.25s ease', transition: 'max-width 0.25s ease, border-color 0.15s', position: 'relative' }}
      >
        {/* 드래그 오버레이 */}
        {isDragging && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, borderRadius: '20px', background: 'color-mix(in srgb, var(--c-accent) 12%, rgba(0,0,0,0.5))', border: '2px dashed var(--c-accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
            <svg width="48" height="48" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <p style={{ color: 'var(--c-accent)', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>HTML 파일을 여기에 놓으세요</p>
            <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>슬러그 자동 생성 · 내용 자동 입력</p>
          </div>
        )}

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
              {post ? '글 수정' : '새 글 쓰기'}
            </h2>
            {loadedFileName && (
              <span style={{ fontSize: '0.7rem', color: 'var(--c-accent-mint)', background: 'color-mix(in srgb, var(--c-accent-mint) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--c-accent-mint) 25%, transparent)', borderRadius: '6px', padding: '0.15rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                {loadedFileName}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input ref={htmlFileRef} type="file" accept=".html,text/html" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadHtmlFile(f); e.target.value = '' }} />
            <button
              type="button"
              onClick={() => htmlFileRef.current?.click()}
              title="HTML 파일 불러오기"
              style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-display)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-accent)'; e.currentTarget.style.color = 'var(--c-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-muted)' }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              HTML 불러오기
            </button>
            <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* 커버 이미지 + 아이콘 */}
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
              <button
                type="button"
                onClick={() => setShowCoverMaker(true)}
                style={{ flexShrink: 0, padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-accent)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.35rem', height: '80px', flexDirection: 'column', justifyContent: 'center' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M3 9h18M9 21V9"/></svg>
                <span>이미지<br/>만들기</span>
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {coverImage && (
                  <button type="button" onClick={() => setCoverImage('')}
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

          {/* 썸네일 텍스트 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              썸네일 텍스트 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(비워두면 글 제목이 표시됩니다)</span>
            </label>
            <input
              type="text"
              value={coverText}
              onChange={e => setCoverText(e.target.value)}
              placeholder="썸네일 이미지에 표시할 텍스트"
              style={inputStyle('coverText')}
              onFocus={e => focusStyle(e, 'coverText')}
              onBlur={e => blurStyle(e, 'coverText')}
            />
          </div>

          {/* 카테고리 + 태그 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                카테고리
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="예: IT기획, AI도구, 일상"
                style={inputStyle('category')}
                onFocus={e => focusStyle(e, 'category')}
                onBlur={e => blurStyle(e, 'category')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                태그 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Enter 또는 쉼표로 추가)</span>
              </label>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', minHeight: '42px', padding: '0.4rem 0.75rem', borderRadius: '10px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', cursor: 'text', transition: 'border-color 0.2s' }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
                onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                onClick={() => document.getElementById('tag-input')?.focus()}
              >
                {tags.map(tag => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', background: 'color-mix(in srgb, var(--c-accent) 15%, transparent)', color: 'var(--c-accent)', border: '1px solid color-mix(in srgb, var(--c-accent) 30%, transparent)', borderRadius: '6px', padding: '0.15rem 0.45rem', fontWeight: 600 }}>
                    #{tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-accent)', padding: 0, lineHeight: 1, fontSize: '0.75rem' }}>×</button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? '태그 입력...' : ''}
                  style={{ flex: 1, minWidth: '80px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--c-text)', fontSize: '0.82rem', padding: '0.1rem 0' }}
                />
              </div>
            </div>
          </div>

          {/* 슬러그 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              URL 슬러그 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(비워두면 본문 제목으로 자동 생성)</span>
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
                placeholder="슬러그-입력"
                style={{ flex: 1, padding: '0.7rem 1rem', background: 'transparent', border: 'none', color: 'var(--c-text)', fontSize: '0.82rem', outline: 'none', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          {/* 로컬 이미지 경고 */}
          {localImgRefs.length > 0 && (
            <div style={{ background: 'color-mix(in srgb, var(--c-warning) 8%, var(--c-surface))', border: '1px solid color-mix(in srgb, var(--c-warning) 30%, transparent)', borderLeft: '3px solid var(--c-warning)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-warning)', marginBottom: '0.6rem', fontFamily: 'var(--font-display)' }}>
                ⚠ 로컬 이미지 {localImgRefs.length}개 — 각 이미지 파일을 업로드하면 자동으로 본문에 삽입됩니다
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {localImgRefs.map(ref => (
                  <label key={ref.src} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '7px', background: 'color-mix(in srgb, var(--c-warning) 5%, transparent)', border: '1px dashed color-mix(in srgb, var(--c-warning) 25%, transparent)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--c-warning) 12%, transparent)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--c-warning) 5%, transparent)')}>
                    <span style={{ fontSize: '0.8rem' }}>📎</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--c-text)', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--c-warning)', fontWeight: 600, flexShrink: 0 }}>클릭하여 업로드</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) replaceLocalImage(ref.src, f); e.target.value = '' }} />
                  </label>
                ))}
              </div>
            </div>
          )}

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
                    {editSrcDoc ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `1px solid ${errors.content ? 'var(--c-danger)' : 'var(--c-accent)'}`, borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ padding: '0.35rem 0.75rem', background: 'color-mix(in srgb, var(--c-accent) 8%, var(--c-surface))', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--c-accent)', flex: 1 }}>✏ 텍스트를 클릭해서 수정 · 저장 시 스타일 그대로 보존</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'var(--c-accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21"/></svg>
                            이미지 삽입
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIframeImageInsert} />
                          </label>
                        </div>
                        <iframe
                          ref={iframeEditRef}
                          srcDoc={editSrcDoc}
                          style={{ flex: 1, border: 'none', minHeight: '380px', width: '100%' }}
                        />
                      </div>
                    ) : (
                      <RichTextEditor
                        key="richtext"
                        value={content}
                        onChange={val => { setContent(val); setErrors(v => ({ ...v, content: '' })) }}
                        hasError={!!errors.content}
                      />
                    )}
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
                      : <div dangerouslySetInnerHTML={{ __html: content }} className="richtext-body" style={{ overflowX: 'hidden' }} />
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
    </>,
    document.body
  )
}
