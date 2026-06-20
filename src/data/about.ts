import {
  faLaptop, faCamera, faFilm, faPaintRoller, faPersonRunning, faPersonWalking,
} from '@fortawesome/free-solid-svg-icons'

export const career = [
  { year: '2019 ~ 2026', role: '가구회사 근무 중',       desc: '가구 디자인 및 제작, 영업 관리, 스키퍼 운용 기사로 활동 중' },
  { year: '2013 ~ 2019', role: '개인사업 · 프리랜서',    desc: '인테리어 및 가구 제작 프리랜서 활동' },
  { year: '2002 ~ 2013', role: 'IT 업계 근무',           desc: 'IT 서비스 기획팀장으로 12년간 사용자 중심의 서비스를 설계하고 운영' },
]

export const skills = [
  { label: 'IT · 기획',       items: ['운영 기획', '웹사이트 관리', 'CS', 'QA'] },
  { label: '가구 · 인테리어', items: ['실측 · 현장 관리', '3D 도면 작업', '자재 발주', '제품 A/S'] },
  { label: '제작 · 가공',     items: ['원목 · 고무나무', 'CNC · 레이저', 'MDF 가공', '가구 조립'] },
  { label: '영업 · 관리',     items: ['견적서 작성', '도면 작성', '납품 관리', '생산 지원'] },
]

export const interests = [
  { icon: faLaptop,        label: '컴퓨터' },
  { icon: faPaintRoller,   label: '인테리어' },
  { icon: faCamera,        label: '사진' },
  { icon: faFilm,          label: '영상' },
  { icon: faPersonRunning, label: '러닝' },
  { icon: faPersonWalking, label: '산책' },
]

export const aboutStats = [
  { num: '24+', label: '경력 연수' },
  { num: '12Y', label: 'IT 기획' },
  { num: '3+',  label: '분야' },
]
