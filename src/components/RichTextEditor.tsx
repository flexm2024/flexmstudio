import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { useRef, useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBold, faItalic, faUnderline, faStrikethrough,
  faLink, faImage, faEraser, faHighlighter,
  faAlignLeft, faAlignCenter, faAlignRight,
  faRotateLeft, faRotateRight, faFaceSmile,
} from '@fortawesome/free-solid-svg-icons'

const EMOJIS = [
  '😊','😂','🥰','😍','🤔','😎','😅','🤣',
  '👍','👎','👏','🙏','💪','🤝','✌️','👋',
  '❤️','💙','💚','💛','🧡','💜','🖤','🤍',
  '🔥','⭐','✅','❌','💡','📌','🚀','🎯',
  '📝','📊','📈','💻','🎨','🔍','📅','🏆',
  '🎉','🎁','💯','⚡','🌟','🌈','💬','🔔',
]

const HEADING_OPTIONS = [
  { label: '보통', value: 'paragraph' },
  { label: '제목 1', value: 'h1' },
  { label: '제목 2', value: 'h2' },
  { label: '제목 3', value: 'h3' },
]

interface Props {
  value: string
  onChange: (html: string) => void
  hasError?: boolean
}

export default function RichTextEditor({ value, onChange, hasError }: Props) {
  const [showEmoji, setShowEmoji] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) editor.commands.setContent(value || '')
  }, [value, editor])

  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  const getHeadingValue = useCallback(() => {
    if (!editor) return 'paragraph'
    if (editor.isActive('heading', { level: 1 })) return 'h1'
    if (editor.isActive('heading', { level: 2 })) return 'h2'
    if (editor.isActive('heading', { level: 3 })) return 'h3'
    return 'paragraph'
  }, [editor])

  const handleHeadingChange = (val: string) => {
    if (!editor) return
    if (val === 'paragraph') editor.chain().focus().setParagraph().run()
    else editor.chain().focus().toggleHeading({ level: Number(val[1]) as 1 | 2 | 3 }).run()
  }

  const handleLink = () => {
    if (!editor) return
    if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return }
    const url = window.prompt('링크 URL을 입력하세요:', 'https://')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (!editor) return null

  const btn = (active = false, danger = false): React.CSSProperties => ({
    padding: '0.28rem 0.42rem',
    borderRadius: '5px',
    border: 'none',
    background: active
      ? 'color-mix(in srgb, var(--c-accent) 18%, transparent)'
      : 'transparent',
    color: active ? 'var(--c-accent)' : danger ? 'var(--c-muted)' : 'var(--c-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.82rem',
    transition: 'all 0.12s',
    minWidth: '28px',
    height: '28px',
  })

  const sep: React.CSSProperties = {
    width: '1px',
    height: '20px',
    background: 'var(--c-border)',
    flexShrink: 0,
    margin: '0 0.2rem',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${hasError ? 'var(--c-danger)' : 'var(--c-border)'}`, borderRadius: '10px', background: 'var(--c-surface2)', overflow: 'visible', transition: 'border-color 0.2s' }}>

      {/* ── 툴바 ── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.1rem', padding: '0.4rem 0.6rem', borderBottom: '1px solid var(--c-border)', background: 'color-mix(in srgb, var(--c-surface) 60%, transparent)', borderRadius: '10px 10px 0 0' }}>

        {/* Undo / Redo */}
        <button type="button" style={btn(!editor.can().undo())} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="실행 취소">
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
        <button type="button" style={btn(!editor.can().redo())} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시 실행">
          <FontAwesomeIcon icon={faRotateRight} />
        </button>

        <div style={sep} />

        {/* 단락 스타일 */}
        <select
          value={getHeadingValue()}
          onChange={e => handleHeadingChange(e.target.value)}
          style={{ padding: '0.2rem 0.4rem', borderRadius: '5px', border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', outline: 'none', height: '28px' }}
        >
          {HEADING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div style={sep} />

        {/* Bold / Italic / Underline / Strike */}
        <button type="button" style={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)">
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button type="button" style={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)">
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button type="button" style={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄 (Ctrl+U)">
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button type="button" style={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선">
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>

        <div style={sep} />

        {/* 텍스트 색상 */}
        <button type="button" style={{ ...btn(editor.isActive('textStyle')), position: 'relative' }} title="글자 색상"
          onClick={() => colorInputRef.current?.click()}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-display)', lineHeight: 1 }}>A</span>
            <span style={{ width: '14px', height: '3px', borderRadius: '1px', background: (editor.getAttributes('textStyle').color as string) || 'var(--c-accent)' }} />
          </span>
          <input ref={colorInputRef} type="color" defaultValue="#4f8aff"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
        </button>

        {/* 형광펜 */}
        <button type="button" style={{ ...btn(editor.isActive('highlight')), position: 'relative' }} title="형광펜"
          onClick={() => highlightInputRef.current?.click()}>
          <FontAwesomeIcon icon={faHighlighter} style={{ fontSize: '0.75rem' }} />
          <input ref={highlightInputRef} type="color" defaultValue="#fef08a"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
        </button>

        {/* 서식 지우기 */}
        <button type="button" style={btn()} onClick={() => editor.chain().focus().unsetAllMarks().run()} title="서식 지우기">
          <FontAwesomeIcon icon={faEraser} style={{ fontSize: '0.75rem' }} />
        </button>

        <div style={sep} />

        {/* 정렬 */}
        <button type="button" style={btn(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="왼쪽 정렬">
          <FontAwesomeIcon icon={faAlignLeft} style={{ fontSize: '0.75rem' }} />
        </button>
        <button type="button" style={btn(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="가운데 정렬">
          <FontAwesomeIcon icon={faAlignCenter} style={{ fontSize: '0.75rem' }} />
        </button>
        <button type="button" style={btn(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="오른쪽 정렬">
          <FontAwesomeIcon icon={faAlignRight} style={{ fontSize: '0.75rem' }} />
        </button>

        <div style={sep} />

        {/* 링크 */}
        <button type="button" style={btn(editor.isActive('link'))} onClick={handleLink} title="링크 삽입">
          <FontAwesomeIcon icon={faLink} style={{ fontSize: '0.75rem' }} />
        </button>

        {/* 이미지 업로드 */}
        <button type="button" style={{ ...btn(), position: 'relative' }} title="이미지 삽입"
          onClick={() => imageInputRef.current?.click()}>
          <FontAwesomeIcon icon={faImage} style={{ fontSize: '0.75rem' }} />
          <input ref={imageInputRef} type="file" accept="image/*"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onChange={handleImageUpload} />
        </button>

        <div style={sep} />

        {/* 이모지 */}
        <div ref={emojiRef} style={{ position: 'relative' }}>
          <button type="button" style={btn(showEmoji)} onClick={() => setShowEmoji(p => !p)} title="이모지">
            <FontAwesomeIcon icon={faFaceSmile} style={{ fontSize: '0.78rem' }} />
          </button>
          {showEmoji && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '0.6rem', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: '240px' }}>
              {EMOJIS.map(e => (
                <button key={e} type="button"
                  onClick={() => { editor.chain().focus().insertContent(e).run(); setShowEmoji(false) }}
                  style={{ fontSize: '1.1rem', padding: '0.3rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px', lineHeight: 1, transition: 'background 0.1s' }}
                  onMouseEnter={el => { (el.currentTarget as HTMLElement).style.background = 'var(--c-surface2)' }}
                  onMouseLeave={el => { (el.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 에디터 영역 ── */}
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  )
}
