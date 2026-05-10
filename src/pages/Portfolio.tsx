import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { useMetaTags } from '../hooks/useMetaTags'
import { usePortfolioProjects, type Project } from '../hooks/usePortfolioProjects'
import { useAdmin } from '../context/AdminContext'
import PortfolioModal from '../components/PortfolioModal'
import PortfolioEditor from '../components/PortfolioEditor'
import { getIcon } from '../lib/icons'

type Category = '전체' | '웹사이트' | '웹앱' | '툴·프로그램' | '토이프로젝트'

const categories: Category[] = ['전체', '웹사이트', '웹앱', '툴·프로그램', '토이프로젝트']

export default function Portfolio() {
  const { projects, addProject, updateProject, deleteProject } = usePortfolioProjects()
  const { isAdmin } = useAdmin()
  const [active, setActive] = useState<Category>('전체')
  const [modal, setModal] = useState<Project | null>(null)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  useMetaTags({ title: '포트폴리오', description: '서비스 기획과 디지털 전환 프로젝트 포트폴리오.', keywords: '포트폴리오, IT 기획, 프로젝트, 서비스 기획', canonical: '/portfolio' })

  const filtered = active === '전체' ? projects : projects.filter(p => p.category === active)

  const handleDelete = (project: Project) => {
    if (window.confirm(`"${project.title}" 프로젝트를 삭제할까요?`)) deleteProject(project.id)
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem var(--page-px)' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: 0 }}>
            <h1 className="section-title" style={{ marginBottom: 0 }}>포트폴리오</h1>
            <span style={{ fontFamily: "'Paperlogy', var(--font-display)", fontSize: '0.8rem', color: 'var(--c-muted)' }}>
              {filtered.length}개
            </span>
          </div>
          <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>개발한 프로젝트와 사이트 모음</p>
          <div className="accent-bar" />
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--c-accent-mint)', fontFamily: 'var(--font-mono)' }}>● 관리자 모드</span>
            <button onClick={() => { setEditTarget(null); setShowEditor(true) }} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1.2rem' }}>
              + 프로젝트 등록
            </button>
          </div>
        )}
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActive(cat)} className={`filter-btn${active === cat ? ' active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
        {filtered.map((project, i) => (
          <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', transitionDelay: `${i * 30}ms` }}>
            {/* 썸네일 */}
            <div style={{ height: '140px', background: project.customColor || project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', borderBottom: '1px solid var(--c-border)', color: 'var(--c-accent)', position: 'relative', overflow: 'hidden' }}>
              {project.coverImage
                ? <img src={project.coverImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : !project.customColor && <FontAwesomeIcon icon={getIcon(project.icon)} />
              }
              {project.coverText && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '1.35rem', color: '#fff', fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 0 8px rgba(0,0,0,1), 0 0 16px rgba(0,0,0,0.8)', maxWidth: '100%' }}>{project.coverText}</span>
                </div>
              )}
              {isAdmin && (
                <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => { setEditTarget(project); setShowEditor(true) }}
                    style={{ fontSize: '0.68rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    수정
                  </button>
                  <button onClick={() => handleDelete(project)}
                    style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    삭제
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span className="badge">{project.category}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer" aria-label="GitHub"
                      style={{ color: 'var(--c-muted)', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}>
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                  )}
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noreferrer" aria-label="Live"
                      style={{ color: 'var(--c-muted)', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-accent-mint)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                  )}
                </div>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: '0.4rem' }}>{project.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', lineHeight: 1.7, flex: 1, marginBottom: '1rem' }}>{project.desc}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', flex: 1, fontSize: '0.78rem', padding: '0.45rem 0.75rem', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    사이트 방문 <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.75em' }} />
                  </a>
                )}
                <button onClick={() => setModal(project)} className="btn-secondary" style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
                  상세 보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PortfolioModal project={modal} onClose={() => setModal(null)} />

      {showEditor && (
        <PortfolioEditor
          project={editTarget}
          onSave={draft => {
            if (editTarget) updateProject(editTarget.id, draft)
            else addProject(draft)
            setShowEditor(false)
          }}
          onClose={() => setShowEditor(false)}
        />
      )}

    </div>
  )
}
