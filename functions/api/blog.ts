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
const SITE_URL = 'https://flexmstudio.com'
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS })
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function toRssDate(dateStr: string): string {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString()
}

async function rssResponse(env: Env): Promise<Response> {
  let posts = await getPosts(env)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const items = posts.slice(0, 20).map(p => {
    const slug = p.slug || p.id
    const link = `${SITE_URL}/blog/${encodeURIComponent(slug)}`
    const desc = escapeXml(p.excerpt || '')
    const img = p.coverImage ? `<br/><img src="${escapeXml(p.coverImage)}" alt="${escapeXml(p.title)}" style="max-width:100%;height:auto;margin-top:0.5rem"/>` : ''
    const content = p.content ? `<description><![CDATA[${desc}${img}]]></description>` : `<description>${desc}</description>`
    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      ${content}
      <pubDate>${toRssDate(p.date)}</pubDate>
    </item>`
  }).join('\n')
  const now = new Date().toUTCString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FlexM Studio Blog</title>
    <link>${SITE_URL}</link>
    <description>IT 기획, 디지털 전환, 생산성에 관한 글들</description>
    <language>ko</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/favicon.svg</url>
      <title>FlexM Studio Blog</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
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
    if (url.searchParams.get('format') === 'rss') return rssResponse(env)
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
