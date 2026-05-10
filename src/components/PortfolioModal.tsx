import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { getIcon } from '../lib/icons'
import { useWindowWidth } from '../hooks/useWindowWidth'

export interface ProjectDetail {
  title: string; category: string; desc: string; longDesc: string
  tags: string[]; period: string; team: string; role: string
  features: string[]; link?: string; github?: string; color: string; icon: string
  coverImage?: string  /* base64 업로드 이미지 — 있으면 아이콘 대신 표시 */
  coverText?: string   /* 썸네일 이미지 위에 표시할 텍스트 */
  customColor?: string /* 썸네일 배경 커스텀 색상 */
}

interface Props { project: ProjectDetail | null; onClose: () => void }

interface CardProps { project: ProjectDetail; onClose: () => void; hp: string; isMobile: boolean }

function ModalCard({ project, onClose, hp, isMobile }: CardProps) {
  return (
    <div
      onClick={!isMobile ? (e => e.stopPropagation()) : undefined}
      style={{
        background: 'var(--c-surface)', border: isMobile ? 'none' : '1px solid var(--c-border)',
        borderRadius: isMobile ? 0 : '18px', width: '100%', maxWidth: isMobile ? '100%' : '680px',
        display: 'flex', flexDirection: 'column',
        animation: isMobile ? undefined : 'modalIn 0.25s ease',
        transition: 'background 0.35s, border-color 0.35s',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${isMobile ? '0.55rem' : '1.25rem'} ${hp}`, borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px', borderRadius: '8px', background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '0.85rem' : '1.1rem', flexShrink: 0, color: 'var(--c-accent)' }}>
            <FontAwesomeIcon icon={getIcon(project.icon)} />
          </div>
          <div>
            <h2 style={{ fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: 700, color: 'var(--c-text)' }}>{project.title}</h2>
            <span className="badge" style={{ marginTop: '2px', display: 'inline-flex' }}>{project.category}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* 바디 */}
      <div style={{ padding: isMobile ? `0.75rem ${hp}` : hp, overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {!isMobile && (
          <div style={{ width: '100%', height: '180px', borderRadius: '12px', background: project.customColor || project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '1.5rem', color: 'var(--c-accent)', overflow: 'hidden' }}>
            {project.coverImage
              ? <img src={project.coverImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : !project.customColor && <FontAwesomeIcon icon={getIcon(project.icon)} />
            }
          </div>
        )}

        <p style={{ fontSize: isMobile ? '0.78rem' : '0.875rem', color: 'var(--c-muted)', lineHeight: 1.7, marginBottom: isMobile ? '0.75rem' : '1.25rem' }}>{project.longDesc}</p>

        <div style={{ marginBottom: isMobile ? '0.75rem' : '1.25rem' }}>
          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: isMobile ? '0.4rem' : '0.6rem' }}>주요 기능</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {project.features.map((f, i) => (
              <li key={i} style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', color: 'var(--c-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <FontAwesomeIcon icon={faAngleRight} style={{ color: 'var(--c-accent-mint)', flexShrink: 0, marginTop: '3px', fontSize: '0.65rem' }} />{f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ padding: `${isMobile ? '0.6rem' : '0.875rem'} ${hp}`, borderTop: '1px solid var(--c-border)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
        {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', flex: '1 1 100px', minWidth: 0, textAlign: 'center', display: 'inline-flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', padding: isMobile ? '0.5rem 1rem' : undefined }}>사이트 방문 <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.8em' }} /></a>}
        {project.github && <a href={project.github} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none', flex: '1 1 80px', minWidth: 0, textAlign: 'center', fontSize: '0.8rem', padding: isMobile ? '0.5rem 1rem' : undefined }}>GitHub</a>}
        <button onClick={onClose} className="btn-secondary" style={{ flex: project.link || project.github ? '0 0 auto' : 1, fontSize: '0.8rem', padding: isMobile ? '0.5rem 1rem' : undefined }}>닫기</button>
      </div>
    </div>
  )
}

export default function PortfolioModal({ project, onClose }: Props) {
  const { isMobile } = useWindowWidth()

  useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [project, onClose])

  if (!project) return null

  const hp = isMobile ? '1rem' : '1.5rem'   // horizontal padding shorthand

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      overflowY: isMobile ? 'hidden' : 'auto',
      animation: 'fadeIn 0.2s ease',
      display: isMobile ? 'flex' : 'block',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}>
      {/* 데스크톱: 중앙 플로팅 / 모바일: 바텀시트 */}
      {!isMobile && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <ModalCard project={project} onClose={onClose} hp={hp} isMobile={false} />
        </div>
      )}
      {isMobile && (
        <div onClick={e => e.stopPropagation()} style={{
          background: 'var(--c-surface)', borderRadius: '20px 20px 0 0',
          border: '1px solid var(--c-border)', borderBottom: 'none',
          width: '100%', maxHeight: '90dvh',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
          transition: 'background 0.35s, border-color 0.35s',
        }}>
          {/* 드래그 핸들 */}
          <div style={{ padding: '0.5rem 0 0.1rem', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'var(--c-border)' }} />
          </div>
          <ModalCard project={project} onClose={onClose} hp={hp} isMobile={true} />
        </div>
      )}
    </div>
  )
}
