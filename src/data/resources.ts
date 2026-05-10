export type RCategory = '전체' | '개발자료' | '템플릿' | '튜토리얼' | '링크모음' | '기타'

export interface Resource {
  id: string
  title: string
  desc: string
  category: Exclude<RCategory, '전체'>
  link: string
  fileType: string
  size?: string
  tags: string[]
  date: string
  downloads: number
  isFile?: boolean
}

export const RESOURCE_KEY = 'flexm_resources'
export const RESOURCE_SEED_VERSION = 'v5'

export const SEED_IDS = new Set(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'])
// 과거 시드 포함 — 삭제된 시드가 사용자 추가 항목으로 오인되지 않도록
export const ALL_KNOWN_SEED_IDS = new Set(['r0','r1','r2','r3','r4','r5','r6','r7','r8'])

export const RESOURCE_SEEDS: Resource[] = [
  { id: 'r0', title: '잔업 정산기 v1.9',               desc: '야근·연장근무 수당을 자동으로 계산하는 웹 앱. 기본급 입력 후 근무 시간만 넣으면 바로 계산.',    category: '기타',     link: '/잔업정산기_v1.9.zip',                fileType: 'clock',         tags: ['잔업', '수당', '근무계산'],          date: '2025.05', downloads: 0, isFile: true, size: '압축파일' },
  { id: 'r1', title: 'React 컴포넌트 - shadcn/ui',     desc: 'Tailwind 기반 고품질 React 컴포넌트 모음. 코드를 복사·붙여넣기로 바로 프로젝트에 적용 가능.',    category: '개발자료', link: 'https://ui.shadcn.com/',                              fileType: 'laptop-code',   tags: ['React', 'TypeScript', 'Tailwind'], date: '2025.02', downloads: 0              },
  { id: 'r2', title: 'CSS 애니메이션 실험실 - Animista', desc: 'keyframes 기반 CSS 애니메이션을 시각적으로 골라 코드를 바로 복사. transition, entrance 등 다양한 효과.', category: '개발자료', link: 'https://animista.net/',                            fileType: 'palette',       tags: ['CSS', '애니메이션'],               date: '2025.01', downloads: 0              },
  { id: 'r3', title: '무료 아이콘 - Lucide Icons',      desc: '깔끔한 오픈소스 SVG 아이콘 1,500+. React·Vue·Svelte 등 모든 프레임워크 패키지 제공.',           category: '링크모음', link: 'https://lucide.dev/',                                 fileType: 'link',          tags: ['아이콘', '디자인', 'SVG'],         date: '2025.01', downloads: 0              },
  { id: 'r4', title: 'Tailwind CSS 치트시트',           desc: '모든 유틸리티 클래스를 카테고리별로 한눈에 볼 수 있는 빠른 참조표.',                             category: '튜토리얼', link: 'https://nerdcave.com/tailwind-cheat-sheet',           fileType: 'file-lines',    tags: ['Tailwind', 'CSS'],                 date: '2024.12', downloads: 0              },
  { id: 'r5', title: '무료 HTML 템플릿 - HTML5 UP',     desc: 'Responsive HTML5 + CSS3 포트폴리오·사이트 템플릿 모음. CCA 3.0 라이선스로 상업적 이용 가능.',    category: '템플릿',   link: 'https://html5up.net/',                                fileType: 'globe',         tags: ['HTML', 'CSS', '템플릿'],           date: '2024.12', downloads: 0              },
  { id: 'r6', title: 'AI 프롬프트 실전 가이드',         desc: 'ChatGPT·Claude·Gemini 업무 활용 프롬프트 모음. 업무 요약, 기획, 코드 작성, 이메일 등 실전 패턴.', category: '개발자료', link: '/ai-prompts.html',                                    fileType: 'robot',         tags: ['AI', '프롬프트', 'ChatGPT'],       date: '2024.11', downloads: 0              },
  { id: 'r7', title: 'Next.js 공식 문서',               desc: 'App Router, 라우팅, 데이터 페칭까지 빠르게 훑는 Next.js 공식 시작 가이드.',                      category: '튜토리얼', link: 'https://nextjs.org/docs/getting-started/installation', fileType: 'rocket',        tags: ['Next.js', 'TypeScript'],           date: '2024.10', downloads: 0              },
]

export const resourceCategories: RCategory[] = ['전체', '개발자료', '템플릿', '튜토리얼', '링크모음', '기타']
