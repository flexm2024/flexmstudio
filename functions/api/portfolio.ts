import { PORTFOLIO_SEEDS } from '../../src/data/portfolio'

interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  APP_KV: KV
  ADMIN_SECRET: string
}

interface Project {
  id: string
  [key: string]: unknown
}

const PORTFOLIO_KV_KEY = 'portfolio_projects'
const SEED_IDS = new Set(PORTFOLIO_SEEDS.map(s => s.id))
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS })
}

async function storedPw(env: Env) {
  return (await env.APP_KV.get('admin_password')) ?? (env.ADMIN_SECRET ?? '1111')
}

async function isAuth(req: Request, env: Env) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  return token === await storedPw(env)
}

async function getProjects(env: Env): Promise<Project[]> {
  const raw = await env.APP_KV.get(PORTFOLIO_KV_KEY)
  return raw ? JSON.parse(raw) : []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequest = async (ctx: any): Promise<Response> => {
  const { request, env }: { request: Request; env: Env } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Authorization,Content-Type' },
    })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const migrate = url.searchParams.get('migrate') === '1'

  if (request.method === 'GET') {
    const list = await getProjects(env)
    return json(list.length > 0 ? list : PORTFOLIO_SEEDS)
  }

  // 마이그레이션은 KV가 시드만 있거나 비었을 때 인증 없이 허용
  if (request.method === 'POST' && migrate) {
    const current = await getProjects(env)
    const isOnlySeeds = current.length === 0 || current.every(p => SEED_IDS.has(p.id))
    if (!isOnlySeeds && !(await isAuth(request, env))) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const body = await request.json() as Project[]
    await env.APP_KV.put(PORTFOLIO_KV_KEY, JSON.stringify(body))
    return json({ ok: true, count: body.length })
  }

  if (!(await isAuth(request, env))) return json({ error: 'Unauthorized' }, 401)

  if (request.method === 'POST') {
    const body = await request.json() as Project
    const projects = await getProjects(env)
    const base = projects.length > 0 ? projects : PORTFOLIO_SEEDS as unknown as Project[]
    await env.APP_KV.put(PORTFOLIO_KV_KEY, JSON.stringify([body, ...base]))
    return json(body, 201)
  }

  if (request.method === 'PUT' && id) {
    const body = await request.json() as Partial<Project>
    const projects = await getProjects(env)
    const base = projects.length > 0 ? projects : PORTFOLIO_SEEDS as unknown as Project[]
    await env.APP_KV.put(PORTFOLIO_KV_KEY, JSON.stringify(base.map(p => p.id === id ? { ...p, ...body } : p)))
    return json({ ok: true })
  }

  if (request.method === 'DELETE' && id) {
    const projects = await getProjects(env)
    const base = projects.length > 0 ? projects : PORTFOLIO_SEEDS as unknown as Project[]
    await env.APP_KV.put(PORTFOLIO_KV_KEY, JSON.stringify(base.filter(p => p.id !== id)))
    return json({ ok: true })
  }

  return json({ error: 'Bad request' }, 400)
}
