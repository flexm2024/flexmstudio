import {
  faUser, faBriefcase, faPenToSquare, faFolderOpen, faEnvelope,
  faLandmark, faBox, faRobot, faFileLines, faLink,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type NavCard = {
  to: string; faIcon: IconDefinition; iconBg: string; title: string
  desc: string; glow: string; tag: string
}

export const phrases = [
  'IT 기획자', '아이디어 메이커', '디지털 큐레이터',
  '테크 인사이더', '서비스 기획자', '가구 디자이너',
]

export const navCards: NavCard[] = [
  { to: '/about',     faIcon: faUser,        iconBg: 'linear-gradient(135deg,#3b7eff,#1a55cc)', title: '나에 대해',  desc: '경력, 관심사, 내가 걸어온 길을 소개합니다.',   glow: 'rgba(59,126,255,0.2)',  tag: 'About'     },
  { to: '/portfolio', faIcon: faBriefcase,   iconBg: 'linear-gradient(135deg,#7c3aed,#5b21b6)', title: '포트폴리오', desc: '참여하고 기획한 서비스와 프로젝트 모음.',       glow: 'rgba(124,58,237,0.2)', tag: 'Portfolio' },
  { to: '/blog',      faIcon: faPenToSquare, iconBg: 'linear-gradient(135deg,#10b981,#059669)', title: '블로그',     desc: 'IT 기획, 디지털 전환에 관한 생각과 기록.',     glow: 'rgba(16,185,129,0.2)', tag: 'Blog'      },
  { to: '/resources', faIcon: faFolderOpen,  iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)', title: '자료 공유',  desc: '유용한 파일, 링크, 템플릿을 공유합니다.',       glow: 'rgba(245,158,11,0.2)', tag: 'Resources' },
  { to: '/contact',   faIcon: faEnvelope,    iconBg: 'linear-gradient(135deg,#ef4444,#dc2626)', title: '연락하기',   desc: '협업 제안이나 자료 요청은 편하게 연락주세요.', glow: 'rgba(239,68,68,0.2)',  tag: 'Contact'   },
]

export const recentProjects = [
  { title: '복지정보 검색 웹사이트', desc: '공공 API로 복지 서비스를 한눈에', faIcon: faLandmark, accent: 'var(--c-accent)' },
  { title: '자재관리 웹앱',          desc: '중소기업 재고 관리 디지털 전환',   faIcon: faBox,      accent: 'var(--c-accent-mint)' },
  { title: 'AI 프롬프트 모음집',     desc: 'AI 도구 프롬프트 공유 플랫폼',    faIcon: faRobot,    accent: 'var(--c-accent-light)' },
]

export const recentResources = [
  { title: 'React 컴포넌트 템플릿 모음', faIcon: faBox,       badge: '개발자료' },
  { title: 'CSS 애니메이션 치트시트',    faIcon: faFileLines, badge: '개발자료' },
  { title: '무료 아이콘 사이트 모음',    faIcon: faLink,      badge: '링크모음' },
]

export const nowItems = [
  { emoji: '📚', label: '읽는 중',  value: '넛지 — 리처드 탈러·캐스 선스타인' },
  { emoji: '🛠️', label: '작업 중',  value: '포트폴리오 사이트 고도화' },
  { emoji: '🎯', label: '관심사',   value: 'AI 업무 자동화 · 가구 UX 디자인' },
  { emoji: '🎧', label: '즐겨 듣는', value: '테크 팟캐스트 · Lo-fi Hip Hop' },
]

export const homeStats = [
  { target: 15,  suffix: '년+', label: 'IT 업계 경력',  color: 'var(--c-accent)'       },
  { target: 50,  suffix: '+',   label: '참여 프로젝트', color: 'var(--c-accent-mint)'  },
  { target: 20,  suffix: '+',   label: '공유 자료',     color: 'var(--c-accent-light)' },
  { target: 100, suffix: '%',   label: '열정',          color: 'var(--c-accent-mint)'  },
]
