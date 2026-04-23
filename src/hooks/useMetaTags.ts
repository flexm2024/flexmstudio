import { useEffect } from 'react'
import { SITE_NAME, SITE_URL, canonicalUrl } from '../lib/seo'

interface MetaOptions {
  title: string
  description?: string
  keywords?: string
  ogType?: 'website' | 'article'
  ogImage?: string
  canonical?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  jsonLd?: Record<string, unknown>
  noIndex?: boolean
}

const DEFAULT_DESC = 'IT 기획자 FlexM의 디지털 공간. 서비스 기획, AI 활용, 디지털 전환에 관한 글과 자료를 공유합니다.'
const DEFAULT_IMAGE = `${SITE_URL}/character.png`

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    const parts = selector.match(/\[([^\]]+)="([^\]]+)"\]/)
    if (parts) el.setAttribute(parts[1], parts[2])
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove()
}

export function useMetaTags(opts: MetaOptions) {
  useEffect(() => {
    const fullTitle = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} | ${SITE_NAME}`
    const desc = opts.description ?? DEFAULT_DESC
    const image = opts.ogImage ?? DEFAULT_IMAGE
    const url = opts.canonical ? canonicalUrl(opts.canonical) : window.location.href
    const type = opts.ogType ?? 'website'

    // title
    document.title = fullTitle

    // basic
    setMeta('meta[name="description"]', 'content', desc)
    if (opts.keywords) setMeta('meta[name="keywords"]', 'content', opts.keywords)
    if (opts.noIndex) setMeta('meta[name="robots"]', 'content', 'noindex,nofollow')

    // Open Graph
    setMeta('meta[property="og:title"]',       'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', desc)
    setMeta('meta[property="og:image"]',       'content', image)
    setMeta('meta[property="og:url"]',         'content', url)
    setMeta('meta[property="og:type"]',        'content', type)
    setMeta('meta[property="og:site_name"]',   'content', SITE_NAME)
    setMeta('meta[property="og:locale"]',      'content', 'ko_KR')

    if (type === 'article') {
      if (opts.publishedTime) setMeta('meta[property="article:published_time"]', 'content', opts.publishedTime)
      if (opts.modifiedTime)  setMeta('meta[property="article:modified_time"]',  'content', opts.modifiedTime)
      if (opts.author)        setMeta('meta[property="article:author"]',          'content', opts.author)
    }

    // Twitter Card
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]',       'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', desc)
    setMeta('meta[name="twitter:image"]',       'content', image)

    // Canonical
    setLink('canonical', url)

    // JSON-LD
    const ldId = 'json-ld-page'
    if (opts.jsonLd) setJsonLd(ldId, opts.jsonLd)
    else removeJsonLd(ldId)
  }, [opts.title, opts.description, opts.ogType, opts.ogImage, opts.canonical, opts.publishedTime, opts.jsonLd])
}
