import { RESOURCE_SEEDS, SEED_IDS } from '../../src/data/resources'
import type { Resource } from '../../src/data/resources'

interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  APP_KV: KV
  ADMIN_SECRET: string
}

const RESOURCE_KV_KEY = 'resources'
// 과거 시드 ID 포함 — KV에서 구버전 시드를 현재 RESOURCE_SEEDS로 교체하기 위해 사용
const ALL_KNOWN_SEED_IDS = new Set(['r0','r1','r2','r3','r4','r5','r6','r7','r8'])
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

async function getResources(env: Env): Promise<Resource[]> {
  const raw = await env.APP_KV.get(RESOURCE_KV_KEY)
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
    const list = await getResources(env)
    if (list.length === 0) return json(RESOURCE_SEEDS)
    // 사용자가 직접 추가한 항목만 보존하고, 시드 항목은 현재 RESOURCE_SEEDS로 대체
    const userAdded = list.filter(r => !ALL_KNOWN_SEED_IDS.has(r.id))
    return json([...RESOURCE_SEEDS, ...userAdded])
  }

  // 마이그레이션은 KV가 시드만 있거나 비었을 때 인증 없이 허용
  if (request.method === 'POST' && migrate) {
    const current = await getResources(env)
    const isOnlySeeds = current.length === 0 || current.every(r => SEED_IDS.has(r.id))
    if (!isOnlySeeds && !(await isAuth(request, env))) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const body = await request.json() as Resource[]
    await env.APP_KV.put(RESOURCE_KV_KEY, JSON.stringify(body))
    return json({ ok: true, count: body.length })
  }

  if (!(await isAuth(request, env))) return json({ error: 'Unauthorized' }, 401)

  if (request.method === 'POST') {
    const body = await request.json() as Resource
    const list = await getResources(env)
    const base = list.length > 0 ? list : RESOURCE_SEEDS
    await env.APP_KV.put(RESOURCE_KV_KEY, JSON.stringify([body, ...base]))
    return json(body, 201)
  }

  if (request.method === 'PUT' && id) {
    const body = await request.json() as Partial<Resource>
    const list = await getResources(env)
    const base = list.length > 0 ? list : RESOURCE_SEEDS
    await env.APP_KV.put(RESOURCE_KV_KEY, JSON.stringify(base.map(r => r.id === id ? { ...r, ...body } : r)))
    return json({ ok: true })
  }

  if (request.method === 'DELETE' && id) {
    const list = await getResources(env)
    const base = list.length > 0 ? list : RESOURCE_SEEDS
    await env.APP_KV.put(RESOURCE_KV_KEY, JSON.stringify(base.filter(r => r.id !== id)))
    return json({ ok: true })
  }

  return json({ error: 'Bad request' }, 400)
}
