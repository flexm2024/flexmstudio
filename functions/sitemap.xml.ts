import type { Post } from '../src/data/blog'

interface KV {
  get(key: string): Promise<string | null>
}

interface Env {
  APP_KV: KV
}

const SITE_URL = 'https://flexmstudio.com'
const BLOG_KV_KEY = 'blog_posts'

const STATIC_PAGES = [
  { path: '/',          changefreq: 'weekly',  priority: '1.0' },
  { path: '/about',     changefreq: 'monthly', priority: '0.8' },
  { path: '/portfolio', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog',      changefreq: 'weekly',  priority: '0.9' },
  { path: '/resources', changefreq: 'weekly',  priority: '0.7' },
  { path: '/contact',   changefreq: 'yearly',  priority: '0.5' },
]

interface Ctx { env: Env }

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { env } = ctx

  let posts: Post[] = []
  try {
    const raw = await env.APP_KV.get(BLOG_KV_KEY)
    posts = raw ? (JSON.parse(raw) as Post[]) : []
  } catch {
    posts = []
  }

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const postUrls = posts
    .map(p => {
      const slug = p.slug || p.id
      return `
  <url>
    <loc>${SITE_URL}/blog/${encodeURIComponent(slug)}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
