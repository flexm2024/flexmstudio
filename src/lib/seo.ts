export const SITE_NAME = 'FlexM Studio'
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://flexmstudio.com'

export function generateSlug(title: string): string {
  const slug = title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return slug || Date.now().toString()
}

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
