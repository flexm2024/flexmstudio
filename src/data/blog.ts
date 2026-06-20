export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category?: string
  tags: string[]
  date: string
  icon: string
  coverImage?: string
  coverText?: string
  readMin: number
  contentType?: 'richtext' | 'markdown' | 'html'
}

export const BLOG_KEY = 'flexm_blog_posts'
