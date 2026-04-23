import { useState, type FormEvent } from 'react'
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
  const [title, setTitle] = useState(project?.title ?? '')
  const [category, setCategory] = useState(project?.category ?? '웹사이트')
  const [desc, setDesc] = useState(project?.desc ?? '')
  const [longDesc, setLongDesc] = useState(project?.longDesc ?? '')
  const [tagsRaw, setTagsRaw] = useState(project?.tags.join(', ') ?? '')
  const [period, setPeriod] = useState(project?.period ?? '')
  const [team, setTeam] = useState(project?.team ?? '')
  const [role, setRole] = useState(project?.role ?? '')
  const [featuresRaw, setFeaturesRaw] = useState(project?.features.join('\n') ?? '')
  const [link, setLink] = useState(project?.link ?? '')
  const [github, setGithub] = useState(project?.github ?? '')
  const [coverImage, setCoverImage] = useState<string | undefined>(project?.coverImage)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!period.trim()) e.period = '개발 기간을 입력해 주세요.'
    if (!team.trim()) e.team = '팀 구성을 입력해 주세요.'
    if (!role.trim()) e.role = '역할을 입력해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const draft: Draft = {
      icon,
      coverImage,
      title: title.trim(),
      category,
      desc: desc.trim(),
      longDesc: longDesc.trim(),
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      period: period.trim(),
      team: team.trim(),
      role: role.trim(),
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

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '20px', width: '100%', maxWidth: '760px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'modalIn 0.25s ease' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
            {project ? '프로젝트 수정' : '새 프로젝트 등록'}
          </h2>
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
                    <button type="button" onClick={() => setCoverImage(undefined)}
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

          {/* 기간 / 팀 / 역할 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
            <div>
              <label style={{ ...labelStyle, color: errors.period ? 'var(--c-danger)' : 'var(--c-muted)' }}>개발 기간</label>
              <input type="text" value={period} onChange={e => { setPeriod(e.target.value); setErrors(v => ({ ...v, period: '' })) }}
                placeholder="예: 3개월" style={inputStyle('period')}
                onFocus={e => onFocus(e, 'period')} onBlur={e => onBlur(e, 'period')} />
              {errors.period && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.period}</p>}
            </div>
            <div>
              <label style={{ ...labelStyle, color: errors.team ? 'var(--c-danger)' : 'var(--c-muted)' }}>팀 구성</label>
              <input type="text" value={team} onChange={e => { setTeam(e.target.value); setErrors(v => ({ ...v, team: '' })) }}
                placeholder="예: 개인 프로젝트" style={inputStyle('team')}
                onFocus={e => onFocus(e, 'team')} onBlur={e => onBlur(e, 'team')} />
              {errors.team && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.team}</p>}
            </div>
            <div>
              <label style={{ ...labelStyle, color: errors.role ? 'var(--c-danger)' : 'var(--c-muted)' }}>내 역할</label>
              <input type="text" value={role} onChange={e => { setRole(e.target.value); setErrors(v => ({ ...v, role: '' })) }}
                placeholder="예: 기획 · 개발" style={inputStyle('role')}
                onFocus={e => onFocus(e, 'role')} onBlur={e => onBlur(e, 'role')} />
              {errors.role && <p style={{ fontSize: '0.72rem', color: 'var(--c-danger)', marginTop: '0.3rem' }}>{errors.role}</p>}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label style={labelStyle}>기술 스택 / 태그 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(쉼표로 구분)</span></label>
            <input type="text" value={tagsRaw} onChange={e => setTagsRaw(e.target.value)}
              placeholder="React, TypeScript, Firebase" style={inputStyle('')}
              onFocus={e => onFocus(e, '')} onBlur={e => onBlur(e, '')} />
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
    </div>
  )
}
