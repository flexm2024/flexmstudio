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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequest = async (ctx: any): Promise<Response> => {
  const { request, env }: { request: Request; env: Env } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...CORS,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH',
        'Access-Control-Allow-Headers': 'Authorization,Content-Type',
      },
    })
  }

  // POST: 로그인
  if (request.method === 'POST') {
    const { password } = await request.json() as { password: string }
    if (password === await storedPw(env)) return json({ ok: true })
    return json({ error: '비밀번호가 틀렸습니다' }, 401)
  }

  // PUT: 비밀번호 변경 (현재 비밀번호 인증 필요)
  if (request.method === 'PUT') {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (token !== await storedPw(env)) return json({ error: 'Unauthorized' }, 401)
    const { newPassword } = await request.json() as { newPassword: string }
    await env.APP_KV.put('admin_password', newPassword)
    return json({ ok: true })
  }

  // GET: 비밀번호 재설정 - 등록 이메일로 OTP 발송
  if (request.method === 'GET') {
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
