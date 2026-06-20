// Web3Forms API 호출을 서버에서 프록시하여 API 키 노출 방지

interface Env {
  WEB3FORMS_KEY?: string
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS })
}

interface Ctx { request: Request; env: Env }

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const apiKey = env.WEB3FORMS_KEY ?? 'c98e903a-fbdb-4dfb-bf63-db3a1143a749'

  try {
    const body = await request.json()
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(body as Record<string, unknown>), access_key: apiKey }),
    })
    const data = await res.json()
    return json(data, res.status)
  } catch (e) {
    console.error('Contact proxy error:', e)
    return json({ error: '서버 오류가 발생했습니다' }, 500)
  }
}
