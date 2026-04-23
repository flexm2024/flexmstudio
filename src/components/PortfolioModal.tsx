import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { getIcon } from '../lib/icons'

export interface ProjectDetail {
  title: string; category: string; desc: string; longDesc: string
  tags: string[]; period: string; team: string; role: string
  features: string[]; link?: string; github?: string; color: string; icon: string
  coverImage?: string  /* base64 업로드 이미지 — 있으면 아이콘 대신 표시 */
}

interface Props { project: ProjectDetail | null; onClose: () => void }

export default function PortfolioModal({ project, onClose }: Props) {
  useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [project, onClose])

  if (!project) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '18px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'modalIn 0.25s ease', transition: 'background 0.35s, border-color 0.35s' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, color: 'var(--c-accent)' }}>
                <FontAwesomeIcon icon={getIcon(project.icon)} />
              </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)' }}>{project.title}</h2>
              <span className="badge" style={{ marginTop: '3px', display: 'inline-flex' }}>{project.category}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 바디 */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          <div style={{ width: '100%', height: '180px', borderRadius: '12px', background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '1.5rem', color: 'var(--c-accent)', overflow: 'hidden' }}>
            {project.coverImage
              ? <img src={project.coverImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FontAwesomeIcon icon={getIcon(project.icon)} />
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[['개발 기간', project.period], ['팀 구성', project.team], ['내 역할', project.role]].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--c-surface2)', borderRadius: '10px', padding: '0.75rem', border: '1px solid var(--c-border)', transition: 'background 0.35s' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--c-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-text)' }}>{value}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--c-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>{project.longDesc}</p>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--c-text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>주요 기능</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {project.features.map((f, i) => (
                <li key={i} style={{ fontSize: '0.82rem', color: 'var(--c-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <FontAwesomeIcon icon={faAngleRight} style={{ color: 'var(--c-accent-mint)', flexShrink: 0, marginTop: '3px', fontSize: '0.75rem' }} />{f}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {project.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--c-border)', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', flex: 1, textAlign: 'center', display: 'inline-flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>사이트 방문 <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.8em' }} /></a>}
          {project.github && <a href={project.github} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>GitHub</a>}
          <button onClick={onClose} className="btn-secondary" style={{ flex: project.link || project.github ? 0 : 1 }}>닫기</button>
        </div>
      </div>
    </div>
  )
}
