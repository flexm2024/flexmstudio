// 자동 블로그 생성기 활성화 상태를 Cloudflare KV로 관리하는 API

interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  APP_KV: KV
  ADMIN_SECRET: string
}

const AUTO_BLOG_KEY = 'auto_blog_enabled'
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS })
}

async function isAuth(req: Request, env: Env) {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return false
  // 세션 토큰 확인 (우선)
  const session = await env.APP_KV.get(`session_${token}`)
  if (session) return true
  // 하위 호환: 비밀번호 자체를 토큰으로 사용한 경우도 허용
  const stored = (await env.APP_KV.get('admin_password')) ?? (env.ADMIN_SECRET ?? '1111')
  return token === stored
}

interface Ctx { request: Request; env: Env }

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Authorization,Content-Type' },
    })
  }

  if (request.method === 'GET') {
    const val = await env.APP_KV.get(AUTO_BLOG_KEY)
    const enabled = val === null ? true : val === 'true'
    return json({ enabled })
  }

  if (request.method === 'POST') {
    if (!(await isAuth(request, env))) return json({ error: 'Unauthorized' }, 401)
    const body = await request.json() as { enabled: boolean }
    await env.APP_KV.put(AUTO_BLOG_KEY, String(body.enabled))
    return json({ ok: true, enabled: body.enabled })
  }

  return json({ error: 'Bad request' }, 400)
}
