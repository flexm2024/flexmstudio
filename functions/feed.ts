// 블로그 RSS 피드를 생성하는 Cloudflare Pages Function
// /feed 경로에서 서비스됨, _redirects에서 /feed.xml → /feed 301

interface KV {
  get(key: string): Promise<string | null>
}

interface Env {
  APP_KV: KV
}

const SITE_URL = 'https://flexmstudio.com'
const BLOG_KV_KEY = 'blog_posts'

interface Post {
  id: string
  slug?: string
  title: string
  excerpt?: string
  content?: string
  coverImage?: string
  date: string
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function toRssDate(dateStr: string): string {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString()
}

interface Ctx { env: Env }

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { env } = ctx

  let posts: Post[] = []
  try {
    const raw = await env.APP_KV.get(BLOG_KV_KEY)
    if (raw) posts = JSON.parse(raw) as Post[]
  } catch {}

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const items = posts.slice(0, 20).map(p => {
    const slug = p.slug || p.id
    const link = `${SITE_URL}/blog/${encodeURIComponent(slug)}`
    const desc = escapeXml(p.excerpt || '')
    const img = p.coverImage
      ? `<br/><img src="${escapeXml(p.coverImage)}" alt="${escapeXml(p.title)}" style="max-width:100%;height:auto;margin-top:0.5rem"/>`
      : ''
    const content = p.content
      ? `<description><![CDATA[${desc}${img}]]></description>`
      : `<description>${desc}</description>`
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
