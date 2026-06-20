import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faDownload, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { useMetaTags } from '../hooks/useMetaTags'
import { useAdmin } from '../context/AdminContext'
import { getIcon } from '../lib/icons'
import { type RCategory, resourceCategories } from '../data/resources'
import { useResources, type Resource } from '../hooks/useResources'
import ResourceEditor from '../components/ResourceEditor'

export default function Resources() {
  const { resources, addResource, updateResource, deleteResource } = useResources()
  const { isAdmin } = useAdmin()
  const [active, setActive] = useState<RCategory>('전체')
  const [query, setQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editTarget, setEditTarget] = useState<Resource | null>(null)

  useMetaTags({ title: '자료공유', description: 'IT 기획 템플릿, 유용한 링크, 개발 자료를 공유합니다.', keywords: '자료공유, 템플릿, IT 기획, 링크 모음', canonical: '/resources' })

  const filtered = useMemo(() => {
    let list = active === '전체' ? resources : resources.filter(r => r.category === active)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [active, query, resources])

  const handleDelete = (r: Resource) => {
    if (window.confirm(`"${r.title}" 자료를 삭제할까요?`)) deleteResource(r.id)
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem var(--page-px)' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0' }}>
        <div>
          <h1 className="section-title">자료 공유</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>개발 관련 자료, 템플릿, 참고자료를 공유합니다</p>
          <div className="accent-bar" />
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--c-accent-mint)', fontFamily: 'var(--font-mono)' }}>● 관리자 모드</span>
            <button onClick={() => { setEditTarget(null); setShowEditor(true) }} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1.2rem' }}>
              + 자료 등록
            </button>
          </div>
        )}
      </div>

      {/* 검색 */}
      <div style={{ position: 'relative', maxWidth: '440px', marginBottom: '1.5rem' }}>
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none', fontSize: '0.85rem' }} />
        <input
          type="text"
          placeholder="자료 이름, 태그로 검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.875rem 0.6rem 2.5rem', borderRadius: '10px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
        />
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {resourceCategories.map(cat => (
          <button key={cat} onClick={() => setActive(cat)} className={`filter-btn${active === cat ? ' active' : ''}`}>{cat}</button>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.875rem', gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0' }}>
            {isAdmin ? '등록된 자료가 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        ) : filtered.map(r => (
          <div key={r.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--c-accent), color-mix(in srgb, var(--c-accent-mint) 60%, transparent))', borderRadius: '16px 16px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 14%, transparent), color-mix(in srgb, var(--c-accent-mint) 8%, transparent))', border: '1px solid color-mix(in srgb, var(--c-accent) 20%, var(--c-border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, color: 'var(--c-accent)', boxShadow: '0 4px 12px color-mix(in srgb, var(--c-accent) 12%, transparent)' }}>
                <FontAwesomeIcon icon={getIcon(r.fileType)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text)' }}>{r.title}</h3>
                  {r.isFile && <span className="badge-mint" style={{ flexShrink: 0 }}>파일</span>}
                </div>
                <p style={{ fontSize: '0.77rem', color: 'var(--c-muted)', lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {r.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                {r.size && <span>{r.size}</span>}
                <span>{r.date}</span>
                <span>↓ {r.downloads}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {isAdmin && (
                  <>
                    <button onClick={() => { setEditTarget(r); setShowEditor(true) }}
                      style={{ fontSize: '0.68rem', color: 'var(--c-text)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      수정
                    </button>
                    <button onClick={() => handleDelete(r)}
                      style={{ fontSize: '0.68rem', color: 'var(--c-danger)', background: 'var(--c-surface)', border: '1px solid color-mix(in srgb, var(--c-danger) 30%, transparent)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      삭제
                    </button>
                  </>
                )}
                <a href={r.link}
                  {...(r.isFile ? { download: r.link.split('/').pop() ?? r.title } : { target: '_blank', rel: 'noreferrer' })}
                  className="btn-primary"
                  style={{ textDecoration: 'none', fontSize: '0.75rem', padding: '0.35rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  {r.isFile
                    ? <><FontAwesomeIcon icon={faDownload} style={{ fontSize: '0.75em' }} /> 다운로드</>
                    : <><FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.75em' }} /> 바로가기</>
                  }
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>원하는 자료가 없으신가요?</p>
        <Link to="/contact" className="btn-secondary" style={{ textDecoration: 'none' }}>자료 요청하기</Link>
      </div>

      {showEditor && (
        <ResourceEditor
          resource={editTarget}
          onSave={editTarget ? (d) => updateResource(editTarget.id, d) : addResource}
          onClose={() => { setShowEditor(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
