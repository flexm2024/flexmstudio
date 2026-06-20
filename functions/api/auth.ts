interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

interface Env {
  APP_KV: KV
  ADMIN_SECRET: string
  RESEND_API_KEY?: string
  RECOVERY_EMAIL?: string
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
const SESSION_TTL = 86400 // 24시간

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS })
}

async function storedPw(env: Env) {
  return (await env.APP_KV.get('admin_password')) ?? (env.ADMIN_SECRET ?? '1111')
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!domain) return '***'
  return `${user.slice(0, 2)}***@${domain}`
}

/** Authorization 헤더에서 세션 토큰을 읽어 유효성 검증 */
async function validateSession(req: Request, env: Env): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return false
  // 세션 토큰 확인
  const session = await env.APP_KV.get(`session_${token}`)
  if (session) return true
  // 하위 호환: 비밀번호 자체를 토큰으로 사용한 경우도 허용 (마이그레이션 기간)
  return token === await storedPw(env)
}

function generateToken(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('')
}

interface Ctx { request: Request; env: Env }

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...CORS,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH',
        'Access-Control-Allow-Headers': 'Authorization,Content-Type',
      },
    })
  }

  // POST: 로그인 → 세션 토큰 발급
  if (request.method === 'POST') {
    const { password } = await request.json() as { password: string }
    if (password !== await storedPw(env)) {
      return json({ error: '비밀번호가 틀렸습니다' }, 401)
    }
    const token = generateToken()
    await env.APP_KV.put(`session_${token}`, '1', { expirationTtl: SESSION_TTL })
    return json({ ok: true, token })
  }

  // PUT: 비밀번호 변경 (세션 토큰 인증)
  if (request.method === 'PUT') {
    if (!(await validateSession(request, env))) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const { newPassword } = await request.json() as { newPassword: string }
    await env.APP_KV.put('admin_password', newPassword)
    return json({ ok: true })
  }

  // GET: 세션 토큰 검증 (?reset=1 → 비밀번호 재설정 이메일 발송)
  if (request.method === 'GET') {
    const url = new URL(request.url)

    // ?reset=1 → 비밀번호 재설정 이메일 발송
    if (url.searchParams.get('reset') === '1') {
      const recoveryEmail = env.RECOVERY_EMAIL
      const resendKey = env.RESEND_API_KEY

      if (!recoveryEmail || !resendKey) {
        return json({
          error: 'RECOVERY_EMAIL 또는 RESEND_API_KEY가 설정되지 않았습니다.\nCloudflare Pages 대시보드 → 설정 → 환경변수에서 추가하세요.',
        }, 503)
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      await env.APP_KV.put('reset_otp', otp, { expirationTtl: 600 })

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FlexM Studio <onboarding@resend.dev>',
          to: [recoveryEmail],
          subject: '[FlexM Studio] 비밀번호 재설정 코드',
          html: `
            <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:2rem;background:#0a0f1e;color:#e2e8f0;border-radius:16px">
              <h2 style="color:#4f8aff;margin:0 0 0.75rem">🔐 비밀번호 재설정</h2>
              <p style="color:#94a3b8;margin:0 0 1.5rem;line-height:1.6">아래 6자리 인증 코드를 입력해 비밀번호를 재설정하세요.</p>
              <div style="background:#151929;border:1px solid #2a3550;border-radius:12px;padding:1.5rem;text-align:center;margin:0 0 1.5rem;letter-spacing:.4em;font-size:2rem;font-weight:700;color:#4f8aff">
                ${otp}
              </div>
              <p style="color:#475569;font-size:0.8rem;margin:0">코드 유효 시간 : <strong>10분</strong> · 본인이 요청하지 않은 경우 무시하세요.</p>
            </div>`,
        }),
      })

      if (!emailRes.ok) {
        console.error('Resend API error:', await emailRes.text())
        return json({ error: '이메일 발송에 실패했습니다. RESEND_API_KEY를 확인하세요.' }, 500)
      }

      return json({ ok: true, maskedEmail: maskEmail(recoveryEmail) })
    }

    // 기본 GET: 세션 토큰 검증 (관리자 상태 확인)
    const ok = await validateSession(request, env)
    return ok ? json({ ok: true }) : json({ ok: false }, 401)
  }

  // PATCH: OTP 검증 + 비밀번호 재설정
  if (request.method === 'PATCH') {
    const { otp, newPassword } = await request.json() as { otp: string; newPassword: string }

    if (!otp?.trim() || !newPassword) return json({ error: '필수 값이 누락되었습니다' }, 400)
    if (newPassword.length < 4) return json({ error: '비밀번호는 4자 이상이어야 합니다' }, 400)

    const storedOtp = await env.APP_KV.get('reset_otp')
    if (!storedOtp) return json({ error: '인증 코드가 만료되었습니다. 다시 요청해 주세요.' }, 400)
    if (otp.trim() !== storedOtp) return json({ error: '인증 코드가 올바르지 않습니다.' }, 400)

    await env.APP_KV.put('admin_password', newPassword)
    await env.APP_KV.delete('reset_otp')
    return json({ ok: true })
  }

  return json({ error: 'Not found' }, 404)
}
