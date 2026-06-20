import type { Post } from '../../src/data/blog'

interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  APP_KV: KV
  ADMIN_SECRET: string
}

const BLOG_KV_KEY = 'blog_posts'
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS })
}

async function storedPw(env: Env) {
  return (await env.APP_KV.get('admin_password')) ?? (env.ADMIN_SECRET ?? '1111')
}

async function isAuth(req: Request, env: Env) {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return false
  // 세션 토큰 확인 (우선)
  const session = await env.APP_KV.get(`session_${token}`)
  if (session) return true
  // 하위 호환: 비밀번호 자체를 토큰으로 사용한 경우도 허용
  return token === await storedPw(env)
}

async function getPosts(env: Env): Promise<Post[]> {
  const raw = await env.APP_KV.get(BLOG_KV_KEY)
  return raw ? JSON.parse(raw) : []
}

interface Ctx { request: Request; env: Env }

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Authorization,Content-Type' },
    })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const migrate = url.searchParams.get('migrate') === '1'

  if (request.method === 'GET') {
    return json(await getPosts(env))
  }

  // 마이그레이션은 KV가 비어있을 때 인증 없이 허용
  if (request.method === 'POST' && migrate) {
    const current = await getPosts(env)
    if (current.length > 0 && !(await isAuth(request, env))) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const body = await request.json() as Post[]
    await env.APP_KV.put(BLOG_KV_KEY, JSON.stringify(body))
    return json({ ok: true, count: body.length })
  }

  if (!(await isAuth(request, env))) return json({ error: 'Unauthorized' }, 401)

  if (request.method === 'POST') {
    const body = await request.json() as Post
    const current = await getPosts(env)
    await env.APP_KV.put(BLOG_KV_KEY, JSON.stringify([body, ...current]))
    return json(body, 201)
  }

  if (request.method === 'PUT' && id) {
    const body = await request.json() as Partial<Post>
    const posts = await getPosts(env)
    await env.APP_KV.put(BLOG_KV_KEY, JSON.stringify(posts.map(p => p.id === id ? { ...p, ...body } : p)))
    return json({ ok: true })
  }

  if (request.method === 'DELETE' && id) {
    const posts = await getPosts(env)
    await env.APP_KV.put(BLOG_KV_KEY, JSON.stringify(posts.filter(p => p.id !== id)))
    return json({ ok: true })
  }

  return json({ error: 'Bad request' }, 400)
}
