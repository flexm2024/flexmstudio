# 블로그 글 작성 지침 (flexmstudio.com)

이 폴더는 flexmstudio.com 블로그에 올릴 HTML 글을 작성하기 위한 공간입니다.
Claude에게 블로그 글 작성을 요청할 때는 이 CLAUDE.md를 참고해서 작성합니다.

---

## 요청 방법

```
[주제]에 대한 블로그 글을 작성해줘.
카테고리: [카테고리명]
대상 독자: [독자층]
포함할 섹션: [섹션1 / 섹션2 / 섹션3]
분량: 약 [N]분 읽기
파일명: [주제]_v1.html
```

예시 참고 파일: `../개 사료 추천_v1.html`

---

## 출력 규칙

- 완전한 HTML 파일 (`<!DOCTYPE html>` ~ `</html>`)
- 파일명: `[주제]_v1.html`
- 폰트: `'Paperlogy', 'Pretendard', sans-serif`
- 다크/라이트 모드: `prefers-color-scheme` 미디어쿼리로 자동 전환
- 언어: 한국어, `word-break: keep-all`
- 최대 너비: 780px, 가운데 정렬
- CSS는 `<style>` 태그 내 인라인으로 전부 포함 (외부 파일 없음)
- **절대 색상값 하드코딩 금지 — 반드시 `var(--c-xxx)` 형태만 사용**

---

## CSS 디자인 토큰

```css
:root {
  --c-bg:          #f4f7ff;
  --c-bg-sub:      #eaeffc;
  --c-surface:     #ffffff;
  --c-surface2:    #e2e9f8;
  --c-border:      rgba(40,96,255,0.13);
  --c-text:        #0b1120;
  --c-muted:       #4a5680;
  --c-accent:      #2860ff;
  --c-accent-dark: #1a4fe0;
  --c-accent-light:#5585ff;
  --c-accent-mint: #20cc80;
  --c-warning:     #f0a020;
  --c-danger:      #ff4060;
  --c-card-shadow: rgba(40,96,255,0.07);
}
@media (prefers-color-scheme: dark) {
  :root {
    --c-bg:          #09090b;
    --c-bg-sub:      #0f0f12;
    --c-surface:     #18181c;
    --c-surface2:    #232328;
    --c-border:      rgba(255,255,255,0.07);
    --c-text:        #f2f2f4;
    --c-muted:       #80808a;
    --c-accent:      #6b8fff;
    --c-accent-dark: #5275f0;
    --c-accent-light:#8aaaff;
    --c-accent-mint: #3ecf8e;
    --c-warning:     #f5b942;
    --c-danger:      #ff5c72;
    --c-card-shadow: rgba(0,0,0,0.45);
  }
}
```

---

## 글 구조

```
① 헤더 (카테고리 뱃지 + H1 + 리드 문장 + 구분바 + 날짜/읽기시간)
② 도입부 본문 (2~3문단)
③ 목차 (TOC)
④ 본문 섹션 4~6개 (H2 + 내용 + 컴포넌트 1개 이상)
⑤ FAQ (5~6개, 선택)
⑥ 마무리
⑦ 태그
```

---

## 컴포넌트 HTML+CSS

### 헤더

```html
<header class="post-header">
  <span class="post-label">카테고리</span>
  <h1>글 제목</h1>
  <p class="post-lead">리드 문장 (1~2문장, 독자 흥미 유발)</p>
  <div class="accent-bar"></div>
  <div class="post-meta">
    <span>✦ 2026년 기준</span>
    <span>· 읽는 시간 약 N분</span>
  </div>
</header>
```

```css
.post-header { margin-bottom: 2.5rem; }
.post-label { display: inline-block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--c-accent) 25%, transparent); border-radius: 999px; padding: 0.25rem 0.75rem; margin-bottom: 1rem; }
h1 { font-size: clamp(1.6rem, 4vw, 2.1rem); font-weight: 800; line-height: 1.25; color: var(--c-text); margin-bottom: 1rem; }
.post-lead { font-size: 1.05rem; color: var(--c-muted); line-height: 1.8; margin-bottom: 1.25rem; }
.accent-bar { width: 40px; height: 3px; background: linear-gradient(90deg, var(--c-accent), var(--c-accent-mint)); border-radius: 999px; margin-bottom: 1.5rem; }
.post-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.78rem; color: var(--c-muted); }
```

### 목차 (TOC)

```html
<nav class="toc">
  <div class="toc-title">목차</div>
  <ol>
    <li><a href="#section1">섹션 제목 1</a></li>
    <li><a href="#section2">섹션 제목 2</a></li>
  </ol>
</nav>
```

```css
.toc { background: var(--c-surface); border: 1px solid var(--c-border); border-left: 3px solid var(--c-accent); border-radius: 12px; padding: 1.25rem 1.5rem; margin: 2rem 0; box-shadow: 0 4px 20px var(--c-card-shadow); }
.toc-title { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-accent); margin-bottom: 0.75rem; }
.toc ol { list-style: none; counter-reset: toc; padding: 0; }
.toc li { counter-increment: toc; display: flex; align-items: baseline; gap: 0.6rem; padding: 0.3rem 0; border-bottom: 1px solid var(--c-border); font-size: 0.88rem; }
.toc li:last-child { border-bottom: none; }
.toc li::before { content: counter(toc, decimal-leading-zero); font-size: 0.72rem; font-weight: 700; color: var(--c-accent); min-width: 1.6rem; }
.toc a { color: var(--c-text); text-decoration: none; }
.toc a:hover { color: var(--c-accent); }
```

### 섹션 제목 (H2, H3, H4)

```css
h2 { font-size: 1.45rem; font-weight: 800; color: var(--c-text); padding-left: 0.9rem; border-left: 4px solid var(--c-accent); margin: 3rem 0 1rem; line-height: 1.3; }
h3 { font-size: 1.1rem; font-weight: 700; color: var(--c-accent); margin: 2rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
h3::after { content: ''; flex: 1; height: 1px; background: var(--c-border); }
h4 { font-size: 0.95rem; font-weight: 700; color: var(--c-text); margin: 1.75rem 0 0.6rem; }
```

### 본문 텍스트

```css
p { font-size: 0.97rem; line-height: 1.85; color: var(--c-text); margin-bottom: 1rem; }
strong { font-weight: 700; color: var(--c-accent); }
mark { background: color-mix(in srgb, var(--c-accent) 18%, transparent); color: var(--c-accent); padding: 0 4px; border-radius: 3px; }
```

### 인용구

```html
<blockquote>내용. <b>강조</b>는 민트색.</blockquote>
```

```css
blockquote { border-left: 3px solid var(--c-accent-mint); padding: 0.6rem 1rem; margin: 1.5rem 0; background: color-mix(in srgb, var(--c-accent-mint) 6%, var(--c-surface)); border-radius: 0 8px 8px 0; font-style: italic; color: var(--c-muted); font-size: 0.92rem; }
blockquote b { color: var(--c-accent-mint); font-style: normal; }
```

### 안내 박스 (파랑) / 경고 박스 (주황)

```html
<div class="box box-info">
  <div class="box-label">💡 포인트</div>
  내용
</div>

<div class="box box-warn">
  <div class="box-label">⚠ 주의</div>
  경고 내용
</div>
```

```css
.box { border-radius: 12px; padding: 1rem 1.25rem; margin: 1.5rem 0; font-size: 0.9rem; line-height: 1.75; }
.box-info { background: color-mix(in srgb, var(--c-accent) 8%, var(--c-surface)); border: 1px solid color-mix(in srgb, var(--c-accent) 20%, transparent); border-left: 3px solid var(--c-accent); }
.box-warn { background: color-mix(in srgb, var(--c-warning) 8%, var(--c-surface)); border: 1px solid color-mix(in srgb, var(--c-warning) 25%, transparent); border-left: 3px solid var(--c-warning); }
.box-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 0.5rem; }
.box-info .box-label { color: var(--c-accent); }
.box-warn .box-label { color: var(--c-warning); }
```

### CTA 박스 (그라디언트)

```html
<div class="cta-box"><p>핵심 메시지나 공유 유도 문구</p></div>
```

```css
.cta-box { background: linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 12%, var(--c-surface)), color-mix(in srgb, var(--c-accent-mint) 8%, var(--c-surface))); border: 1px solid color-mix(in srgb, var(--c-accent) 20%, transparent); border-radius: 16px; padding: 1.5rem; margin: 2rem 0; text-align: center; }
```

### 테이블

```html
<div class="table-wrap">
  <table>
    <thead><tr><th>항목</th><th>설명</th></tr></thead>
    <tbody><tr><td>값1</td><td>내용1</td></tr></tbody>
  </table>
</div>
```

```css
.table-wrap { overflow-x: auto; margin: 1.5rem 0; border-radius: 12px; border: 1px solid var(--c-border); box-shadow: 0 4px 20px var(--c-card-shadow); }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
thead tr { background: linear-gradient(135deg, var(--c-accent), var(--c-accent-dark)); }
thead th { padding: 0.75rem 1rem; text-align: left; color: #fff; font-weight: 700; font-size: 0.82rem; }
tbody tr { border-top: 1px solid var(--c-border); }
tbody tr:nth-child(even) { background: color-mix(in srgb, var(--c-accent) 3%, var(--c-surface)); }
tbody tr:hover { background: color-mix(in srgb, var(--c-accent) 6%, var(--c-surface)); }
td { padding: 0.65rem 1rem; color: var(--c-text); vertical-align: top; line-height: 1.6; }
td:first-child { font-weight: 600; color: var(--c-accent); }
```

### 번호 리스트 (카드형)

```html
<ol class="brand-list">
  <li><span><strong>항목 이름</strong> — 설명 텍스트</span></li>
</ol>
```

```css
ol.brand-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; counter-reset: brand; }
ol.brand-list li { display: flex; align-items: baseline; gap: 0.75rem; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.92rem; counter-increment: brand; box-shadow: 0 2px 8px var(--c-card-shadow); transition: border-color 0.2s, transform 0.2s; }
ol.brand-list li:hover { border-color: color-mix(in srgb, var(--c-accent) 40%, transparent); transform: translateX(2px); }
ol.brand-list li::before { content: counter(brand, decimal-leading-zero); font-size: 0.72rem; font-weight: 800; color: var(--c-accent); min-width: 1.8rem; background: color-mix(in srgb, var(--c-accent) 10%, transparent); border-radius: 6px; padding: 0.1rem 0.4rem; text-align: center; }
```

### 불릿 리스트 (단계형)

```html
<ul class="step-list">
  <li><strong>단계명</strong>: 내용 설명</li>
</ul>
```

```css
ul.step-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
ul.step-list li { display: flex; align-items: baseline; gap: 0.75rem; font-size: 0.92rem; line-height: 1.7; padding: 0.5rem 0; border-bottom: 1px solid var(--c-border); }
ul.step-list li:last-child { border-bottom: none; }
ul.step-list li::before { content: '▸'; color: var(--c-accent); font-size: 0.75rem; flex-shrink: 0; }
ul.step-list strong { color: var(--c-accent-light); }
```

### FAQ

```html
<div class="faq-item">
  <div class="faq-q"><div class="faq-q-badge">Q</div>질문 내용</div>
  <div class="faq-a">
    <div class="faq-a-badge">A</div>
    <div class="faq-a-text">
      상세 답변
      <span class="answer-summary">→ 한 줄 핵심 요약</span>
    </div>
  </div>
</div>
```

```css
.faq-item { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 12px; overflow: hidden; margin-bottom: 0.75rem; box-shadow: 0 2px 8px var(--c-card-shadow); }
.faq-q { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; font-weight: 700; font-size: 0.92rem; color: var(--c-text); border-bottom: 1px solid var(--c-border); }
.faq-q-badge { flex-shrink: 0; width: 1.5rem; height: 1.5rem; border-radius: 6px; background: var(--c-accent); color: #fff; font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.faq-a { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.85rem 1.25rem; }
.faq-a-badge { flex-shrink: 0; width: 1.5rem; height: 1.5rem; border-radius: 6px; background: color-mix(in srgb, var(--c-accent-mint) 20%, var(--c-surface2)); color: var(--c-accent-mint); font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.faq-a-text { font-size: 0.88rem; color: var(--c-muted); line-height: 1.75; }
.answer-summary { display: block; font-weight: 700; color: var(--c-accent-mint); font-size: 0.85rem; margin-top: 0.5rem; }
```

### 태그 (글 하단)

```html
<div class="tags">
  <span class="tag">태그1</span>
  <span class="tag">태그2</span>
</div>
```

```css
.tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--c-border); }
.tag { font-size: 0.72rem; color: var(--c-muted); background: var(--c-surface2); border: 1px solid var(--c-border); border-radius: 999px; padding: 0.2rem 0.65rem; }
```

### 구분선 / 래퍼

```css
hr { border: none; border-top: 1px solid var(--c-border); margin: 2rem 0; }
.wrap { max-width: 780px; margin: 0 auto; padding: 3.5rem 1.5rem 5rem; }
@media (max-width: 600px) {
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.2rem; }
  .wrap { padding: 2rem 1rem 3rem; }
}
```

---

## 글쓰기 스타일

- **톤**: 1인칭 구어체 ("저는", "저도", "~더라고요", "~거든요")
- **분위기**: 친근하지만 신뢰감 있게, 딱딱하지 않게
- **경험**: 개인 경험/사례 1~2개 포함
- **이모지**: 섹션 제목과 박스 라벨에만 제한적으로 사용
- **SEO**: `<title>`에 핵심 키워드 + 연도 포함, `<meta description>` 80~120자
- **분량**: H2 섹션마다 700~1000자 내외, 각 섹션에 컴포넌트 1개 이상

---

## 완성 후 사이트 등록 방법

1. 완성된 HTML 파일을 이 폴더(`blog-writing/`)에 저장
2. flexmstudio.com 접속 → 관리자 로그인
3. 블로그 → `+ 새 글 쓰기` → 콘텐츠 타입: **HTML**
4. HTML 파일 내용을 붙여넣기 후 저장
