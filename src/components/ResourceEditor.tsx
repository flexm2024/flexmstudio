import { useState, type FormEvent } from 'react'
import type { Resource, RCategory } from '../data/resources'

type Draft = Omit<Resource, 'id'>

interface Props {
  resource: Resource | null
  onSave: (draft: Draft) => void
  onClose: () => void
}

const CATEGORIES: Exclude<RCategory, '전체'>[] = ['개발자료', '템플릿', '튜토리얼', '링크모음', '기타']
const FILE_TYPES = ['box', 'file-lines', 'link', 'file-pdf', 'file-code', 'file-zipper', 'file-image', 'database', 'book']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px',
  background: 'var(--c-surface2)', border: '1px solid var(--c-border)',
  color: 'var(--c-text)', fontSize: '0.85rem', outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box', transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.73rem', fontWeight: 600,
  color: 'var(--c-muted)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)',
}

export default function ResourceEditor({ resource, onSave, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 7).replace('-', '.')
  const [title, setTitle] = useState(resource?.title ?? '')
  const [desc, setDesc] = useState(resource?.desc ?? '')
  const [category, setCategory] = useState<Exclude<RCategory, '전체'>>(resource?.category ?? '개발자료')
  const [link, setLink] = useState(resource?.link ?? '')
  const [fileType, setFileType] = useState(resource?.fileType ?? 'file-lines')
  const [size, setSize] = useState(resource?.size ?? '')
  const [tagsRaw, setTagsRaw] = useState(resource?.tags.join(', ') ?? '')
  const [date, setDate] = useState(resource?.date ?? today)
  const [downloads, setDownloads] = useState(resource?.downloads ?? 0)
  const [isFile, setIsFile] = useState(resource?.isFile ?? false)
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!link.trim()) { setError('링크를 입력해주세요.'); return }

    onSave({
      title: title.trim(),
      desc: desc.trim(),
      category,
      link: link.trim(),
      fileType,
      size: size.trim() || undefined,
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      date,
      downloads: Number(downloads),
      isFile,
    })
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '18px', width: '100%', maxWidth: '480px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.25s ease' }}>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
          {resource ? '자료 수정' : '자료 등록'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="자료 제목" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>설명</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="자료 설명" rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>카테고리</label>
              <select value={category} onChange={e => setCategory(e.target.value as Exclude<RCategory, '전체'>)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>아이콘 타입</label>
              <select value={fileType} onChange={e => setFileType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>링크 (URL) *</label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>파일 크기 (선택)</label>
              <input value={size} onChange={e => setSize(e.target.value)} placeholder="예: 2.4 MB" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>날짜</label>
              <input value={date} onChange={e => setDate(e.target.value)} placeholder="2025.01" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>태그 (쉼표로 구분)</label>
            <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="React, TypeScript" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>다운로드 수</label>
              <input type="number" value={downloads} onChange={e => setDownloads(Number(e.target.value))} min={0} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.4rem' }}>
              <input type="checkbox" id="isFile" checked={isFile} onChange={e => setIsFile(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="isFile" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>파일 다운로드</label>
            </div>
          </div>

          {error && <p style={{ fontSize: '0.75rem', color: 'var(--c-danger)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>취소</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>저장</button>
          </div>
        </form>
      </div>
    </div>
  )
}
