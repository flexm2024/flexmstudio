# 블로그 카테고리 + 태그 입력 기능 설계

**날짜:** 2026-05-14  
**상태:** 승인됨

## 배경

현재 `BlogEditor`에서 글을 저장할 때 `tags: []`로 하드코딩되어 있어 카테고리/태그 입력이 불가능하다. 블로그 목록 페이지의 태그 필터 버튼은 있지만 실제로는 동작하지 않는 상태.

## 목표

- 글 등록/수정 시 카테고리(대분류 1개)와 태그(세부 키워드 복수)를 입력할 수 있게 한다.
- 블로그 목록 필터를 카테고리 기준으로 동작시킨다.

## 데이터 모델

`src/data/blog.ts`의 `Post` 인터페이스에 `category?: string` 추가.

```ts
export interface Post {
  // 기존 필드 유지
  category?: string   // 추가: 대분류 카테고리 (자유 입력, 1개)
  tags: string[]      // 유지: 세부 키워드 태그
}
```

기존 시드 데이터 및 localStorage 저장 글과의 호환을 위해 optional(`?`)로 처리.

## BlogEditor 변경

커버/아이콘 섹션 아래에 두 필드 추가:

1. **카테고리 입력** (`<input type="text">`)
   - placeholder: "카테고리 (예: IT기획, AI도구)"
   - 자유 입력, 1개
   - state: `category: string`

2. **태그 칩 입력**
   - `<input>` + Enter 또는 쉼표(,)로 태그 추가
   - 추가된 태그는 칩(pill) 형태로 표시, × 버튼으로 개별 삭제
   - state: `tags: string[]`

`handleSubmit`에서 `tags: []` 하드코딩을 `tags`, `category` 실제 값으로 교체.

## Blog.tsx 변경

- `allTags` → `allCategories` 로 교체: `Post.category` 값 기준으로 수집
- 필터 버튼은 "전체" + 등록된 카테고리 목록
- `activeTag` → `activeCategory` state로 rename
- 필터 로직: `posts.filter(p => p.category === activeCategory)`
- 태그는 카드 하단 뱃지로만 표시 (클릭 필터 기능 없음)

## 범위 외

- 태그 기반 필터링 (카테고리 필터만 구현)
- 카테고리 자동완성 (자유 입력만)
- 기존 시드 데이터의 category 값 채우기 (선택 사항)
