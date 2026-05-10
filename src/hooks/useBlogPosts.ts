import { useState, useCallback, useEffect, useRef } from 'react'
import { generateSlug } from '../lib/seo'
import { type Post, BLOG_KEY, BLOG_SEEDS } from '../data/blog'

export type { Post }

function calcReadMin(content: string) {
  const text = content.replace(/<[^>]+>/g, ' ')
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function ensureSlug(post: Post): Post {
  return post.slug ? post : { ...post, slug: generateSlug(post.title) || post.id }
}

function loadCache(): Post[] {
  try {
    const raw = localStorage.getItem(BLOG_KEY)
    if (raw) return (JSON.parse(raw) as Post[]).map(ensureSlug)
  } catch {}
  return BLOG_SEEDS.map(ensureSlug)
}

function getToken() {
  return sessionStorage.getItem('adm_token') ?? ''
}

const SEED_IDS = new Set(['1', '2', '3'])

export function useBlogPosts() {
  const [posts, setPosts] = useState<Post[]>(loadCache)
  const lastWriteRef = useRef(0)

  const syncFromServer = useCallback(async () => {
    // 로컬 저장 후 5초 이내엔 서버 데이터로 덮어쓰지 않음 (레이스 컨디션 방지)
    if (Date.now() - lastWriteRef.current < 5000) return
    try {
      const data: Post[] = await fetch('/api/blog').then(r => r.json())
      if (data.length === 0) {
        const raw = localStorage.getItem(BLOG_KEY)
        if (raw) {
          const localPosts = JSON.parse(raw) as Post[]
          const hasExtra = localPosts.some((p: Post) => !SEED_IDS.has(p.id))
          if (hasExtra) {
            await fetch('/api/blog?migrate=1', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localPosts),
            })
            const mapped = localPosts.map(ensureSlug)
            setPosts(mapped)
            localStorage.setItem(BLOG_KEY, JSON.stringify(mapped))
          }
        }
        return
      }
      const mapped = data.map(ensureSlug)
      setPosts(mapped)
      localStorage.setItem(BLOG_KEY, JSON.stringify(mapped))
    } catch {}
  }, [])

  useEffect(() => {
    syncFromServer()
    const onVisibility = () => { if (document.visibilityState === 'visible') syncFromServer() }
    document.addEventListener('visibilitychange', onVisibility)
    const interval = setInterval(syncFromServer, 30_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(interval)
    }
  }, [syncFromServer])

  const addPost = useCallback((draft: Omit<Post, 'id' | 'date' | 'readMin'>) => {
    const next: Post = {
      ...draft,
      slug: draft.slug || generateSlug(draft.title),
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      readMin: calcReadMin(draft.content),
    }
    lastWriteRef.current = Date.now()
    setPosts(prev => {
      const updated = [next, ...prev]
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated))
      return updated
    })
    fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(next),
    }).catch(console.error)
  }, [])

  const updatePost = useCallback((id: string, patch: Partial<Omit<Post, 'id'>>) => {
    lastWriteRef.current = Date.now()
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p
        const merged = { ...p, ...patch }
        merged.readMin = calcReadMin(merged.content)
        return merged
      })
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated))
      return updated
    })
    fetch(`/api/blog?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(patch),
    }).catch(console.error)
  }, [])

  const deletePost = useCallback((id: string) => {
    lastWriteRef.current = Date.now()
    setPosts(prev => {
      const updated = prev.filter(p => p.id !== id)
      localStorage.setItem(BLOG_KEY, JSON.stringify(updated))
      return updated
    })
    fetch(`/api/blog?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(console.error)
  }, [])

  return { posts, addPost, updatePost, deletePost }
}
