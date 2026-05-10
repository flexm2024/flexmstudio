import { useState, useEffect, useRef, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getIcon } from '../lib/icons'
import type { Project } from '../hooks/usePortfolioProjects'
import { categoryColor } from '../hooks/usePortfolioProjects'

type Draft = Omit<Project, 'id'>

interface Props {
  project: Project | null
  onSave: (draft: Draft) => void
  onClose: () => void
}

const CATEGORIES = ['웹사이트', '웹앱', '툴·프로그램', '토이프로젝트']

const PORTFOLIO_ICON_PRESETS = [
  'briefcase', 'laptop-code', 'globe', 'rocket', 'robot',
  'landmark', 'box', 'chart-bar', 'database', 'code',
  'server', 'layer-group', 'pen-to-square', 'wrench', 'palette',
  'shield-halved', 'terminal', 'graduation-cap', 'star', 'cloud-sun',
]

export default function PortfolioEditor({ project, onSave, onClose }: Props) {
  const [icon, setIcon] = useState(project?.icon ?? 'briefcase')
  const [coverText, setCoverText] = useState(project?.coverText ?? '')
  const [customColor, setCustomColor] = useState(project?.customColor ?? '')
  const [title, setTitle] = useState(project?.title ?? '')
  const [category, setCategory] = useState(project?.category ?? '웹사이트')
  const [desc, setDesc] = useState(project?.desc ?? '')
  const [longDesc, setLongDesc] = useState(project?.longDesc ?? '')
  const [featuresRaw, setFeaturesRaw] = useState(project?.features.join('\n') ?? '')
  const [link, setLink] = useState(project?.link ?? '')
  const [github, setGithub] = useState(project?.github ?? '')
  const [coverImage, setCoverImage] = useState(project?.coverImage ?? '')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el || pos !== null) return
    const rect = el.getBoundingClientRect()
    setPos({ x: (window.innerWidth - rect.width) / 2, y: Math.max(24, (window.innerHeight - rect.height) / 2) })
  })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - offset.current.x, y: Math.max(0, e.clientY - offset.current.y) })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const onDragStart = (e: React.MouseEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - (pos?.x ?? 0), y: e.clientY - (pos?.y ?? 0) }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = '제목을 입력해 주세요.'
    if (!desc.trim()) e.desc = '간단 설명을 입력해 주세요.'
    if (!longDesc.trim()) e.longDesc = '상세 설명을 입력해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const draft: Draft = {
      icon,
      coverImage: coverImage,
      coverText: coverText.trim(),
      customColor: customColor,
      title: title.trim(),
      category,
      desc: desc.trim(),
      longDesc: longDesc.trim(),
      tags: project?.tags ?? [],
      period: '',
      team: '',
      role: '',
      features: featuresRaw.split('\n').map(f => f.trim()).filter(Boolean),
      link: link.trim() || undefined,
      github: github.trim() || undefined,
      color: categoryColor(category),
    }
    onSave(draft)
  }

  const inputStyle = (key: string): React.CSSProperties => ({
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    background: 'var(--c-surface2)',
    border: `1px solid ${errors[key] ? 'var(--c-danger)' : 'var(--c-border)'}`,
    color: 'var(--c-text)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  })

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, key: string) => {
    if (!errors[key]) e.currentTarget.style.borderColor = 'var(--c-accent)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, key: string) => {
    if (!errors[key]) e.currentTarget.style.borderColor = 'var(--c-border)'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--c-muted)', marginBottom: '0.4rem',
    fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease', pointerEvents: pos ? 'auto' : 'none' }} onClick={onClose}>
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: pos?.y ?? '50%',
          left: pos?.x ?? '50%',
          transform: pos ? 'none' : 'translate(-50%,-50%)',
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: '20px',
          width: '760px',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalIn 0.25s ease',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* 헤더 - 드래그 핸들 */}
        <div
          onMouseDown={onDragStart}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0, cursor: 'grab', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.3 }}>
              <div style={{ display: 'flex', gap: '3px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--c-text)' }} />)}</div>
              <div style={{ display: 'flex', gap: '3px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--c-text)' }} />)}</div>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
              {project ? '프로젝트 수정' : '새 프로젝트 등록'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* 커버 이미지 / 아이콘 + 카테고리 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>커버 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(이미지 또는 아이콘)</span></label>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                {/* 이미지 업로드 */}
                <label style={{ flexShrink: 0, width: '80px', height: '64px', borderRadius: '10px', border: `2px dashed ${coverImage ? 'var(--c-accent)' : 'var(--c-border)'}`, background: 'var(--c-surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {coverImage
                    ? <img src={coverImage} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: '0.6rem', lineHeight: 1.6 }}>
                        <div style={{ fontSize: '1rem' }}>+</div>이미지
                      </div>
                  }
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {coverImage && (
                    <button type="button" onClick={() => setCoverImage('')}
                      style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'transparent', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>
                      제거
                    </button>
                  )}
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setShowIconPicker(p => !p)}
                      style={{ padding: '0.35rem 0.7rem', borderRadius: '8px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: coverImage ? 'var(--c-muted)' : 'var(--c-accent)', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: coverImage ? 0.5 : 1 }}>
                      <FontAwesomeIcon icon={getIcon(icon)} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>아이콘 ▾</span>
                    </button>
                    {showIconPicker && (
                      <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: '240px' }}>
                        {PORTFOLIO_ICON_PRESETS.map(key => (
                          <button key={key} type="button" title={key}
                            onClick={() => { setIcon(key); setShowIconPicker(false) }}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: key === icon ? '2px solid var(--c-accent)' : '2px solid transparent', background: key === icon ? 'color-mix(in srgb, var(--c-accent) 12%, transparent)' : 'transparent', cursor: 'pointer', color: key === icon ? 'var(--c-accent)' : 'var(--c-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            <FontAwesomeIcon icon={getIcon(key)} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>카테고리</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ ...inputStyle(''), appearance: 'none', cursor: 'pointer' }}
                onFocus={e => onFocus(e, '')} onBlur={e => onBlur(e, '')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* 배경 색상 */}
          <div>
            <label style={labelStyle}>배경 색상 / 패턴 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(선택 안 하면 카테고리 기본색)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              {/* 이미지 패턴 프리셋 */}
              {[
                { key: "url('/bg-network.png') center/cover no-repeat", src: '/bg-network.png', label: '네트워크 패턴' },
              ].map(({ key, src, label }) => (
                <button key={key} type="button" onClick={() => setCustomColor(customColor === key ? '' : key)} title={label}
                  style={{ width: '42px', height: '26px', borderRadius: '6px', backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: 'center', border: customColor === key ? '2px solid var(--c-text)' : '2px solid var(--c-border)', outline: customColor === key ? '2px solid var(--c-accent)' : 'none', outlineOffset: '1px', cursor: 'pointer', flexShrink: 0, transition: 'outline 0.1s' }}
                />
              ))}
              {/* 구분선 */}
              <div style={{ width: '1px', height: '20px', background: 'var(--c-border)', flexShrink: 0 }} />
              {/* 단색 프리셋 */}
              {[
                '#3b7eff','#0ea5e9','#6366f1','#7c3aed','#a855f7',
                '#ec4899','#ef4444','#f97316','#f59e0b','#eab308',
                '#22c55e','#10b981','#14b8a6','#1e293b','#334155','#64748b',
              ].map(c => (
                <button key={c} type="button" onClick={() => setCustomColor(customColor === c ? '' : c)}
                  style={{ width: '26px', height: '26px', borderRadius: '6px', background: c, border: customColor === c ? '2px solid var(--c-text)' : '2px solid transparent', outline: customColor === c ? '2px solid var(--c-accent)' : 'none', outlineOffset: '1px', cursor: 'pointer', flexShrink: 0, transition: 'outline 0.1s' }}
                />
              ))}
              {/* 직접 입력 */}
              <label title="직접 색상 선택" style={{ width: '26px', height: '26px', borderRadius: '6px', border: '2px dashed var(--c-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative', background: 'var(--c-surface2)' }}>
                <svg width="12" height="12" fill="none" stroke="var(--c-muted)" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                <input type="color" value={customColor.match(/^#[0-9a-f]{6}$/i) ? customColor : '#3b7eff'} onChange={e => setCustomColor(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </label>
              {customColor && (
                <button type="button" onClick={() => setCustomColor('')}
                  style={{ fontSize: '0.68rem', color: 'var(--c-muted)', background: 'transparent', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                  초기화
                </button>
              )}
            </div>
            {customColor && (
              <div style={{ marginTop: '0.5rem', width: '100%', height: '32px', borderRadius: '8px', background: customColor, border: '1px solid var(--c-border)' }} />
            )}
          </div>

          {/* 썸네일 텍스트 */}
          <div>
            <label style={labelStyle}>썸네일 텍스트 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(비워두면 표시 안 함)</span></label>
            <input type="text" value={coverText} onChange={e => setCoverText(e.target.value)}
              placeholder="썸네일 이미지에 표시할 텍스트"
              style={inputStyle('')}
              onFocus={e => onFocus(e, '')} onBlur={e => onBlur(e, '')} />
          </div>

          {/* 제목 */}
          <div>
            <label style={{ ...labelStyle, color: errors.title ? 'var(--c-danger)' : 'var(--c-muted)' }}>제목</label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(v => ({ ...v, title: '' })) }}
              placeholder="프로젝트 이름" style={inputStyle('title')}
              onFocus={e => onFocus(e, 'title')} onBlur={e => onBlur(e, 'title')} />
            {errors.title && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.title}</p>}
          </div>

          {/* 간단 설명 */}
          <div>
            <label style={{ ...labelStyle, color: errors.desc ? 'var(--c-danger)' : 'var(--c-muted)' }}>간단 설명 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(카드에 표시)</span></label>
            <input type="text" value={desc} onChange={e => { setDesc(e.target.value); setErrors(v => ({ ...v, desc: '' })) }}
              placeholder="한두 문장으로 프로젝트를 설명해 주세요" style={inputStyle('desc')}
              onFocus={e => onFocus(e, 'desc')} onBlur={e => onBlur(e, 'desc')} />
            {errors.desc && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.desc}</p>}
          </div>

          {/* 상세 설명 */}
          <div>
            <label style={{ ...labelStyle, color: errors.longDesc ? 'var(--c-danger)' : 'var(--c-muted)' }}>상세 설명 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(모달에 표시)</span></label>
            <textarea value={longDesc} onChange={e => { setLongDesc(e.target.value); setErrors(v => ({ ...v, longDesc: '' })) }}
              placeholder="프로젝트 배경, 목적, 주요 내용을 자세히 작성해 주세요" rows={3}
              style={{ ...inputStyle('longDesc'), resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}
              onFocus={e => onFocus(e, 'longDesc')} onBlur={e => onBlur(e, 'longDesc')} />
            {errors.longDesc && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.longDesc}</p>}
          </div>

          {/* 주요 기능 */}
          <div>
            <label style={labelStyle}>주요 기능 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(한 줄에 하나씩)</span></label>
            <textarea value={featuresRaw} onChange={e => setFeaturesRaw(e.target.value)}
              placeholder={'실시간 검색 기능\n반응형 모바일 지원\n다크모드'} rows={4}
              style={{ ...inputStyle(''), resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}
              onFocus={e => onFocus(e, '')} onBlur={e => onBlur(e, '')} />
          </div>

          {/* 링크 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>사이트 URL <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(선택)</span></label>
              <input type="text" value={link} onChange={e => setLink(e.target.value)}
                placeholder="https://example.com" style={inputStyle('')}
                onFocus={e => onFocus(e, '')} onBlur={e => onBlur(e, '')} />
            </div>
            <div>
              <label style={labelStyle}>GitHub URL <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(선택)</span></label>
              <input type="text" value={github} onChange={e => setGithub(e.target.value)}
                placeholder="https://github.com/..." style={inputStyle('')}
                onFocus={e => onFocus(e, '')} onBlur={e => onBlur(e, '')} />
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--c-border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>취소</button>
          <button type="button" onClick={handleSubmit as unknown as React.MouseEventHandler} className="btn-primary" style={{ flex: 2 }}>
            {project ? '수정 저장' : '등록하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
