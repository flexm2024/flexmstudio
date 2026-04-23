import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faDownload, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { useScrollFadeIn } from '../hooks/useScrollFadeIn'
import { useMetaTags } from '../hooks/useMetaTags'
import { getIcon } from '../lib/icons'

type RCategory = '전체' | '개발자료' | '템플릿' | '튜토리얼' | '링크모음' | '기타'

interface Resource {
  title: string
  desc: string
  category: Exclude<RCategory, '전체'>
  link: string
  fileType: string   /* FontAwesome icon key */
  size?: string
  tags: string[]
  date: string
  downloads: number
  isFile?: boolean
}

const resources: Resource[] = [
  { title: 'React 컴포넌트 템플릿 모음',    desc: '자주 쓰는 React 컴포넌트 패턴 모음 ZIP 파일입니다.',         category: '개발자료', link: '#', fileType: 'box',        size: '2.4 MB', tags: ['React', 'TypeScript'],    date: '2024.11', downloads: 182, isFile: true  },
  { title: 'CSS 애니메이션 치트시트',        desc: 'transform, keyframes, transition 정리 PDF.',              category: '개발자료', link: '#', fileType: 'file-lines', size: '340 KB', tags: ['CSS', '애니메이션'],     date: '2024.10', downloads: 254, isFile: true  },
  { title: '무료 아이콘 사이트 모음',        desc: 'Heroicons, Feather, Lucide 등 개발자 추천 무료 아이콘.',    category: '링크모음', link: '#', fileType: 'link',                       tags: ['아이콘', '디자인'],      date: '2024.10', downloads: 97              },
  { title: 'Tailwind CSS 빠른 참조표',       desc: '클래스명·속성 한눈에 보는 치트시트 PDF.',                  category: '튜토리얼', link: '#', fileType: 'file-lines', size: '520 KB', tags: ['Tailwind', 'CSS'],       date: '2024.09', downloads: 318, isFile: true  },
  { title: '개인 웹사이트 HTML 템플릿',      desc: 'Vanilla HTML/CSS로 만든 포트폴리오 템플릿 ZIP.',           category: '템플릿',   link: '#', fileType: 'box',        size: '1.1 MB', tags: ['HTML', 'CSS'],           date: '2024.09', downloads: 143, isFile: true  },
  { title: 'AI 프롬프트 명령어 모음',        desc: 'ChatGPT · Claude · Gemini 실전 프롬프트 PDF 가이드.',      category: '개발자료', link: '#', fileType: 'file-lines', size: '890 KB', tags: ['AI', '프롬프트'],        date: '2024.08', downloads: 412, isFile: true  },
  { title: 'Next.js 프로젝트 스타터 템플릿', desc: 'Tailwind + ESLint + Prettier 설정 완료된 보일러플레이트.', category: '템플릿',   link: '#', fileType: 'box',        size: '3.2 MB', tags: ['Next.js', 'TypeScript'], date: '2024.07', downloads: 229, isFile: true  },
  { title: '개발자 추천 유튜브 채널 모음',   desc: '한국어 · 영어 개발 강의 유튜브 채널 큐레이션 링크 모음.',   category: '링크모음', link: '#', fileType: 'link',                       tags: ['유튜브', '학습'],        date: '2024.06', downloads: 88              },
]

const categories: RCategory[] = ['전체', '개발자료', '템플릿', '튜토리얼', '링크모음', '기타']

export default function Resources() {
  const [active, setActive] = useState<RCategory>('전체')
  const [query, setQuery]   = useState('')
  const listRef = useScrollFadeIn()

  useMetaTags({ title: '자료공유', description: 'IT 기획 템플릿, 유용한 링크, 개발 자료를 공유합니다.', keywords: '자료공유, 템플릿, IT 기획, 링크 모음', canonical: '/resources' })

  const filtered = useMemo(() => {
    let list = active === '전체' ? resources : resources.filter(r => r.category === active)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q)  ||
        r.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [active, query])

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>
      <h1 className="section-title">자료 공유</h1>
      <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>개발 관련 자료, 템플릿, 참고자료를 공유합니다</p>
      <div className="accent-bar" />

      {/* Search */}
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

      {/* Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActive(cat)} className={`filter-btn${active === cat ? ' active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div ref={listRef} className="scroll-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.875rem', gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0' }}>
            검색 결과가 없습니다.
          </p>
        ) : filtered.map((r, i) => (
          <div key={r.title} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transitionDelay: `${i * 40}ms` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'color-mix(in srgb, var(--c-accent) 10%, transparent)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, color: 'var(--c-accent)' }}>
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
              <a href={r.link} target="_blank" rel="noreferrer" className="btn-primary"
                style={{ textDecoration: 'none', fontSize: '0.75rem', padding: '0.35rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {r.isFile
                  ? <><FontAwesomeIcon icon={faDownload} style={{ fontSize: '0.75em' }} /> 다운로드</>
                  : <><FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.75em' }} /> 바로가기</>
                }
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>원하는 자료가 없으신가요?</p>
        <Link to="/contact" className="btn-secondary" style={{ textDecoration: 'none' }}>자료 요청하기</Link>
      </div>
    </div>
  )
}
