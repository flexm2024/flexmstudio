import { useState, useCallback } from 'react'
import { generateSlug } from '../lib/seo'

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  date: string
  icon: string
  coverImage?: string
  readMin: number
  contentType?: 'richtext' | 'markdown' | 'html'
}

const KEY = 'flexm_blog_posts'

const SEEDS: Post[] = [
  {
    id: '1',
    slug: 'IT-기획자가-AI-도구를-활용하는-방법',
    title: 'IT 기획자가 AI 도구를 활용하는 방법',
    excerpt: 'ChatGPT, Claude 등 AI 도구들을 실무 기획 업무에서 어떻게 활용하고 있는지 경험을 공유합니다.',
    content: `# IT 기획자가 AI 도구를 활용하는 방법

최근 AI 도구들의 발전이 놀랍습니다. 특히 서비스 기획 업무에서 큰 도움을 받고 있어 경험을 공유하려 합니다.

## 기획 문서 작성

Claude나 ChatGPT를 활용하면 PRD(Product Requirements Document)의 초안을 빠르게 작성할 수 있습니다. 아이디어를 던지면 체계적인 구조로 정리해 줍니다.

## 경쟁사 분석

경쟁사의 특징들을 나열하고 AI에게 비교 분석을 요청하면 놓쳤던 관점을 발견하는 경우가 많습니다.

## 사용자 시나리오 작성

페르소나 설정과 사용자 여정 지도 작성에도 AI가 큰 도움이 됩니다. 다양한 엣지 케이스를 미리 발견할 수 있어요.

## 마무리

AI 도구는 기획자를 대체하는 것이 아니라, 반복적인 작업을 줄여주고 더 창의적인 생각에 집중할 수 있게 해줍니다.`,
    tags: ['AI', '기획', '생산성'],
    date: '2024-12-10',
    icon: 'robot',
    readMin: 4,
  },
  {
    id: '2',
    slug: '디지털-전환-중소기업은-어디서-시작해야-할까',
    title: '디지털 전환, 중소기업은 어디서 시작해야 할까',
    excerpt: '수십 개 중소기업의 디지털 전환을 돕고 나서 정리한 실전 가이드입니다.',
    content: `# 디지털 전환, 중소기업은 어디서 시작해야 할까

중소기업의 디지털 전환을 돕는 프로젝트를 여러 번 진행하면서 공통적인 패턴을 발견했습니다.

## 가장 큰 장벽: 어디서 시작할지 모른다

많은 중소기업 대표님들이 디지털 전환의 필요성은 알지만 첫 발을 내딛기 어려워합니다. 가장 좋은 시작점은 **현재 가장 불편한 업무 프로세스**입니다.

## Step 1: 문제 정의

엑셀로 관리하는 재고, 카카오톡으로 주고받는 발주서, 수기로 작성하는 일일 보고서... 어디서 시간이 가장 많이 낭비되는지 파악하세요.

## Step 2: 작게 시작하기

전사적 ERP 도입보다는 노션, 구글 워크스페이스 같은 도구로 작은 문제부터 해결하세요.

## Step 3: 내재화

외부 개발사에 맡기더라도, 내부 담당자가 운영할 수 있도록 교육과 문서화가 필수입니다.`,
    tags: ['디지털전환', '중소기업', '기획'],
    date: '2024-11-22',
    icon: 'lightbulb',
    readMin: 5,
  },
  {
    id: '3',
    slug: '좋은-서비스-기획서란-무엇인가',
    title: '좋은 서비스 기획서란 무엇인가',
    excerpt: '10년간 기획서를 써오면서 깨달은, 개발팀이 좋아하는 기획서의 조건.',
    content: `# 좋은 서비스 기획서란 무엇인가

기획자로 10년을 일하면서 수백 개의 기획서를 작성했습니다. 개발팀에서 가장 좋은 반응을 얻었던 기획서의 특징을 정리해 봤습니다.

## 1. 왜(Why)가 명확하다

무엇을 만들지(What)보다 왜 만들어야 하는지(Why)가 먼저 설명되어야 합니다.

## 2. 엣지 케이스가 고려되어 있다

개발자들이 가장 힘들어하는 것은 "그럼 이 경우엔 어떻게 해요?"라는 질문에 기획서가 답을 주지 않는 경우입니다.

## 3. 화면 플로우가 있다

글로만 설명된 기획서보다 화면 전환 플로우가 함께 있으면 이해도가 훨씬 높아집니다.

## 4. 우선순위가 명확하다

MVP(Minimum Viable Product)와 후속 기능을 명확히 구분해 주세요.`,
    tags: ['기획', '문서작성', '협업'],
    date: '2024-10-15',
    icon: 'pen-to-square',
    readMin: 3,
  },
]

function calcReadMin(content: string) {
  const text = content.replace(/<[^>]+>/g, ' ')
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function ensureSlug(post: Post): Post {
  return post.slug ? post : { ...post, slug: generateSlug(post.title) || post.id }
}

function load(): Post[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return (JSON.parse(raw) as Post[]).map(ensureSlug)
  } catch {}
  localStorage.setItem(KEY, JSON.stringify(SEEDS))
  return SEEDS
}

function persist(posts: Post[]) {
  localStorage.setItem(KEY, JSON.stringify(posts))
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<Post[]>(load)

  const addPost = useCallback((draft: Omit<Post, 'id' | 'date' | 'readMin'>) => {
    const next: Post = {
      ...draft,
      slug: draft.slug || generateSlug(draft.title),
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      readMin: calcReadMin(draft.content),
    }
    setPosts(prev => { const updated = [next, ...prev]; persist(updated); return updated })
  }, [])

  const updatePost = useCallback((id: string, patch: Partial<Omit<Post, 'id'>>) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p
        const merged = { ...p, ...patch }
        merged.readMin = calcReadMin(merged.content)
        return merged
      })
      persist(updated)
      return updated
    })
  }, [])

  const deletePost = useCallback((id: string) => {
    setPosts(prev => { const updated = prev.filter(p => p.id !== id); persist(updated); return updated })
  }, [])

  return { posts, addPost, updatePost, deletePost }
}
