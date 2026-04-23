import { useState, useCallback } from 'react'
import type { ProjectDetail } from '../components/PortfolioModal'

export interface Project extends ProjectDetail {
  id: string
}

const KEY = 'flexm_portfolio_v2'

const COLORS = [
  'linear-gradient(135deg,color-mix(in srgb,var(--c-accent) 28%,transparent),color-mix(in srgb,var(--c-accent) 10%,transparent))',
  'linear-gradient(135deg,color-mix(in srgb,var(--c-accent-mint) 28%,transparent),color-mix(in srgb,var(--c-accent-mint) 10%,transparent))',
  'linear-gradient(135deg,color-mix(in srgb,var(--c-accent-light) 28%,transparent),color-mix(in srgb,var(--c-accent) 10%,transparent))',
  'linear-gradient(135deg,color-mix(in srgb,var(--c-accent) 20%,transparent),color-mix(in srgb,var(--c-accent-mint) 12%,transparent))',
]

export function categoryColor(category: string, idx = 0): string {
  const map: Record<string, string> = {
    '웹사이트':    COLORS[0],
    '웹앱':        COLORS[1],
    '툴·프로그램': COLORS[2],
    '토이프로젝트': COLORS[3],
  }
  return map[category] ?? COLORS[idx % COLORS.length]
}

const SEEDS: Project[] = [
  {
    id: '1',
    title: '복지정보 검색 웹사이트',
    category: '웹사이트',
    desc: '지역별·대상별 복지 정보를 한눈에 검색하고 확인할 수 있는 서비스.',
    longDesc: '공공 API를 연동해 전국 복지 서비스를 카테고리별로 정리한 검색 플랫폼입니다. 지역, 연령대, 키워드 필터를 통해 맞춤형 복지 정보를 제공합니다.',
    tags: ['React', 'TypeScript', 'Public API', 'Tailwind CSS'],
    period: '3개월',
    team: '개인 프로젝트',
    role: '기획 · 디자인 · 개발',
    features: ['공공데이터 API 연동 및 실시간 검색', '지역/연령/키워드 복합 필터', '즐겨찾기 로컬 저장', '반응형 모바일 지원'],
    link: '#',
    github: '#',
    icon: 'landmark',
    color: COLORS[0],
  },
  {
    id: '2',
    title: '자재관리 웹앱',
    category: '웹앱',
    desc: '중소기업을 위한 자재 입출고 및 재고 관리 시스템.',
    longDesc: '엑셀로 관리하던 자재 재고를 웹으로 전환한 업무용 앱입니다. 입고/출고 이력 관리, 재고 알림, 월별 리포트 기능을 제공합니다.',
    tags: ['Next.js', 'PostgreSQL', 'Prisma', 'Chart.js'],
    period: '4개월',
    team: '2인 팀',
    role: '풀스택 개발',
    features: ['자재 CRUD 및 카테고리 분류', '입출고 이력 추적', '재고 부족 알림', '월별/주별 통계 차트'],
    link: '#',
    github: '#',
    icon: 'box',
    color: COLORS[1],
  },
  {
    id: '3',
    title: 'AI 프롬프트 모음집',
    category: '툴·프로그램',
    desc: '카테고리별로 정리된 ChatGPT/Claude 프롬프트 공유 플랫폼.',
    longDesc: '다양한 AI 도구를 위한 프롬프트를 커뮤니티가 함께 수집·공유하는 플랫폼입니다. 좋아요·북마크 기능과 태그 기반 검색을 지원합니다.',
    tags: ['React', 'Firebase', 'TypeScript'],
    period: '2개월',
    team: '개인 프로젝트',
    role: '기획 · 개발',
    features: ['프롬프트 등록 및 태그 분류', '실시간 좋아요 · 북마크', '카테고리 / 태그 필터 검색', 'Firebase 인증'],
    link: '#',
    github: '#',
    icon: 'robot',
    color: COLORS[2],
  },
  {
    id: '4',
    title: '개인 포트폴리오 사이트',
    category: '웹사이트',
    desc: '지금 보고 계신 개인 포트폴리오 웹사이트. React + TypeScript로 제작.',
    longDesc: 'React + TypeScript + Vite 조합으로 구축한 개인 포트폴리오 사이트입니다. 다크모드, 반응형 디자인, 페이지 전환 애니메이션을 포함합니다.',
    tags: ['React', 'TypeScript', 'Vite'],
    period: '2주',
    team: '개인 프로젝트',
    role: '기획 · 디자인 · 개발',
    features: ['React Router SPA 라우팅', '다크/라이트 모드 토글', '스크롤 fade-in 애니메이션', '모바일 반응형'],
    github: '#',
    icon: 'briefcase',
    color: COLORS[3],
  },
  {
    id: '5',
    title: '날씨 대시보드',
    category: '웹앱',
    desc: '현재 위치 기반 날씨 정보와 7일 예보를 보여주는 대시보드.',
    longDesc: 'OpenWeatherMap API로 현재 위치 날씨와 주간 예보를 시각화하는 대시보드입니다. 도시 검색과 즐겨찾기 기능을 제공합니다.',
    tags: ['React', 'OpenWeatherMap API', 'Recharts'],
    period: '3주',
    team: '개인 프로젝트',
    role: '기획 · 개발',
    features: ['GPS 기반 현재 위치 날씨', '7일 주간 예보', '도시 검색 자동완성', '기온 추이 차트'],
    link: '#',
    github: '#',
    icon: 'cloud-sun',
    color: COLORS[0],
  },
  {
    id: '7',
    title: 'Nukki AI — 배경 제거 툴',
    category: '툴·프로그램',
    desc: 'AI가 브라우저에서 직접 이미지 배경을 제거하는 웹앱. 서버 전송 없이 완전 로컬 처리.',
    longDesc: 'WASM 기반 AI 모델(@imgly/background-removal)을 활용해 이미지 배경을 브라우저 내에서 직접 처리합니다. 이미지가 서버로 전송되지 않아 개인정보가 완벽하게 보호되며, Before/After 슬라이더로 결과를 직관적으로 비교할 수 있습니다. Framer Motion으로 부드러운 애니메이션을 구현했습니다.',
    tags: ['React', 'TypeScript', 'WASM', 'AI', 'Framer Motion'],
    period: '1주',
    team: '개인 프로젝트',
    role: '기획 · 개발',
    features: [
      'WASM 기반 완전 로컬 AI 처리 (서버 전송 없음)',
      'Before/After 드래그 슬라이더 비교',
      '드래그앤드롭 이미지 업로드',
      '실시간 처리 진행률 표시',
      '고해상도 PNG 다운로드',
    ],
    link: '/nukki-ai',
    github: '#',
    icon: 'image',
    color: COLORS[2],
  },
  {
    id: '6',
    title: 'Todo & 메모 앱',
    category: '토이프로젝트',
    desc: '드래그앤드롭으로 순서 변경이 가능한 Todo + 마크다운 메모 앱.',
    longDesc: '칸반 스타일 Todo 관리와 마크다운 메모 기능을 합친 생산성 앱입니다. 로컬스토리지로 데이터가 유지됩니다.',
    tags: ['React', 'TypeScript', 'dnd-kit', 'MDX'],
    period: '1개월',
    team: '개인 프로젝트',
    role: '개발',
    features: ['드래그앤드롭 순서 변경', '마크다운 실시간 미리보기', '태그 및 우선순위 설정', '로컬스토리지 영속화'],
    github: '#',
    icon: 'pen-to-square',
    color: COLORS[1],
  },
]

function load(): Project[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Project[]
  } catch {}
  localStorage.setItem(KEY, JSON.stringify(SEEDS))
  return SEEDS
}

function persist(projects: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(projects))
}

export function usePortfolioProjects() {
  const [projects, setProjects] = useState<Project[]>(load)

  const addProject = useCallback((draft: Omit<Project, 'id'>) => {
    const next: Project = { ...draft, id: Date.now().toString() }
    setProjects(prev => { const updated = [next, ...prev]; persist(updated); return updated })
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Omit<Project, 'id'>>) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...patch } : p)
      persist(updated)
      return updated
    })
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => { const updated = prev.filter(p => p.id !== id); persist(updated); return updated })
  }, [])

  return { projects, addProject, updateProject, deleteProject }
}
