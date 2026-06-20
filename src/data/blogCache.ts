// 블로그 데이터를 모듈 초기화 시점에 미리 로드하여 Blog 페이지 진입 시 즉시 표시
import type { Post } from './blog'

let preloaded: Post[] | null = null
let preloadedMap = new Map<string, Post>() // id → post 빠른 조회용
let preloadPromise: Promise<void> | null = null

export function getPreloadedPosts(): Post[] | null {
  return preloaded
}

export function getPreloadedMap(): Map<string, Post> {
  return preloadedMap
}

export function preloadBlogPosts(): Promise<void> {
  if (preloadPromise) return preloadPromise
  if (preloaded !== null) return Promise.resolve()

  preloadPromise = fetch('/api/blog')
    .then(r => r.json())
    .then((data: Post[]) => {
      preloaded = data
      preloadedMap = new Map(data.map(p => [p.id, p]))
    })
    .catch(() => {
      preloaded = []
    })

  return preloadPromise
}
