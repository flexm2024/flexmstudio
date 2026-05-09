# Cover Image Maker — Design Spec

**Date:** 2026-05-09  
**Status:** Approved

---

## Overview

BlogEditor 안에 내장된 관리자 전용 커버 이미지 제작 도구. 블로그 글 작성 중 커버 이미지를 바로 디자인하고, WebP로 압축 다운로드하거나 커버로 직접 적용한다.

출력 사이즈: **1200 × 300 px**, 포맷: **WebP** (품질 조절 가능)

---

## Architecture

### 신규 파일

- `src/components/CoverImageMaker.tsx` — 커버 이미지 메이커 모달 전체

### 수정 파일

- `src/components/BlogEditor.tsx` — 커버 이미지 업로드 영역 옆에 "이미지 만들기" 버튼 추가, `CoverImageMaker` 모달 상태 관리

---

## Component: CoverImageMaker

### Props

```ts
interface CoverImageMakerProps {
  initialTitle: string        // BlogEditor에서 현재 제목 자동 전달
  onApply: (dataUrl: string) => void  // "커버로 적용" 콜백
  onClose: () => void
}
```

### 상태

| 상태 | 타입 | 설명 |
|------|------|------|
| `color1` | string | 배경 그라디언트 시작색 |
| `color2` | string | 배경 그라디언트 끝색 |
| `direction` | `'to right' \| 'to bottom right' \| 'to bottom'` | 그라디언트 방향 |
| `title` | string | 제목 텍스트 (초기값: props.initialTitle) |
| `subtitle` | string | 부제목 텍스트 |
| `textColor` | string | 제목·부제목 공통 색상 (부제목은 동일 색에 0.7 alpha 적용) |
| `quality` | number | WebP 품질 0.0~1.0 (기본 0.85) |

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  🖼 커버 이미지 만들기                     1200 × 300 px  │
├──────────────┬──────────────────────────────────────────┤
│ 프리셋 템플릿  │                                          │
│ [다크][그라디] │         Canvas 미리보기 (4:1 비율)        │
│ [파스텔][오션] │                                          │
│ [선셋][포레스] │                                          │
│──────────────│                                          │
│ 배경 색상      │  실제 출력: 1200×300 · WebP 85%          │
│ 색1 [컬러픽]  │                                          │
│ 색2 [컬러픽]  │  [↓ WebP 다운로드]  [✓ 커버로 적용]       │
│ 방향 [→][↘][↓]│                                          │
│──────────────│                                          │
│ 텍스트         │                                          │
│ 제목 [input]  │                                          │
│ 부제목 [input] │                                          │
│ 색상 [컬러픽]  │                                          │
│──────────────│                                          │
│ WebP 품질     │                                          │
│ [슬라이더] 85% │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## Preset Templates (6종)

| 이름 | color1 | color2 | direction | textColor |
|------|--------|--------|-----------|-----------|
| 다크 미드나잇 | `#1a1a2e` | `#16213e` | to bottom right | `#ffffff` |
| 비비드 그라디언트 | `#667eea` | `#f093fb` | to right | `#ffffff` |
| 파스텔 소프트 | `#ffecd2` | `#fcb69f` | to right | `#1c1917` |
| 딥 오션 | `#0f2027` | `#2c5364` | to bottom right | `#7dd3fc` |
| 선셋 골드 | `#f7971e` | `#ffd200` | to right | `#1c1917` |
| 포레스트 그린 | `#134e5e` | `#71b280` | to bottom right | `#ffffff` |

---

## Canvas Rendering

HTML Canvas API로 1200×300 오프스크린 캔버스에 직접 그린다.

**렌더링 순서:**
1. `createLinearGradient`로 배경 그라디언트 채우기
2. 제목 텍스트: 중앙 정렬, bold 폰트, `fillText`
3. 부제목 텍스트: 제목 아래, 더 작은 폰트, 반투명 처리

**미리보기:** `<canvas>` 엘리먼트를 CSS로 `width: 100%` 축소 표시 (실제 해상도 1200×300 유지)

**상태 변경 시마다** `useEffect`로 캔버스 다시 그리기

---

## Export & Apply

**WebP 다운로드:**
```ts
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob!)
  // <a> 태그로 cover-image.webp 다운로드
}, 'image/webp', quality)
```

**커버로 적용:**
```ts
const dataUrl = canvas.toDataURL('image/webp', quality)
onApply(dataUrl)  // BlogEditor의 setCoverImage 호출
onClose()
```

---

## BlogEditor 연동

커버 이미지 업로드 `<label>` 옆에 "이미지 만들기" 버튼 추가:

```tsx
<button onClick={() => setShowCoverMaker(true)}>
  이미지 만들기
</button>

{showCoverMaker && (
  <CoverImageMaker
    initialTitle={title}
    onApply={(dataUrl) => setCoverImage(dataUrl)}
    onClose={() => setShowCoverMaker(false)}
  />
)}
```

---

## Out of Scope

- 배경 이미지 업로드 (추후 필요 시 추가)
- 패턴/도형 오버레이
- 이모지/아이콘 배치
- 텍스트 위치 선택 (중앙 고정)
- 모바일 레이아웃 (관리자 전용, 데스크톱 기준)
