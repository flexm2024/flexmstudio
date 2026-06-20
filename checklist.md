# 전체 수정 체크리스트

## Phase 1 — Quick Wins (즉시, 독립 실행)
- [x] `sitemap.xml.ts`: BLOG_SEEDS import 제거, `[]` fallback
- [x] `robots.txt`: sitemap URL 도메인 수정 (flexm.studio → flexmstudio.com)
- [x] `@types/react-router-dom` devDependency 제거
- [x] `AdminContext.tsx`: migrateToKV dead code 제거 (SEED_IDS + 함수)
- [x] 빈 catch 블록에 `console.error` 추가 (8개 파일)
- [x] Portfolio seed overImage 최적화 (base64 제거)
- [x] `usePortfolioProjects`: server merge 로직 추가 (race condition 수정)
- [x] `useResources`: server merge 로직 추가 (race condition 수정)

## Phase 2 — Web3Forms 프록시 + `any` 타입
- [x] `/api/contact` CF Functions 프록시 생성
- [x] `Contact.tsx`: 직접 Web3Forms 호출 → `/api/contact` 호출로 변경
- [x] CF Functions 6개 파일 `interface Ctx` 도입으로 `any` 타입 제거 (auth/blog/portfolio/resources/auto-blog/sitemap)

## Phase 3 — Admin 인증 세션 토큰화
- [x] POST `/api/auth`: 로그인 시 32바이트 랜덤 세션 토큰 발급 → KV 24h TTL 저장
- [x] GET `/api/auth`: `Authorization` 헤더로 세션 검증 (`?reset=1` → Resend API 이메일 발송, OTP 재설정)
- [x] `AdminContext.tsx`: login()에서 토큰 sessionStorage 저장, isAdmin 마운트 시 GET `/api/auth`로 서버 검증
- [x] `AdminContext.tsx`: changePassword()에 세션 토큰 사용, requestPasswordReset()에 `?reset=1` 쿼리
- [x] 모든 API endpoint blog.ts/portfolio.ts/resources.ts/auto-blog.ts: isAuth에 세션 토큰 우선 검증 + password fallback

## Phase 4 — Data Hook Provider 패턴 (미시작)
- [ ] 각 data type별 Context Provider 생성 (BlogProvider, PortfolioProvider, ResourceProvider)
- [ ] 기존 hook이 Context를 소비하도록 변경
- [ ] 중복 polling 제거

## 검증
- [x] `npm run build` 통과 (tsc + vite)
- [x] LSP diagnostics clean (14개 파일)
