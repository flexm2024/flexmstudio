import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AdminCtx {
  isAdmin: boolean
  login: (pw: string) => Promise<boolean>
  logout: () => void
  changePassword: (currentPw: string, newPw: string) => Promise<boolean>
  requestPasswordReset: () => Promise<{ ok: boolean; maskedEmail?: string; error?: string }>
  confirmPasswordReset: (otp: string, newPw: string) => Promise<{ ok: boolean; error?: string }>
}

const Ctx = createContext<AdminCtx>({
  isAdmin: false,
  login: async () => false,
  logout: () => {},
  changePassword: async () => false,
  requestPasswordReset: async () => ({ ok: false }),
  confirmPasswordReset: async () => ({ ok: false }),
})

/** sessionStorage에 저장된 토큰으로 서버에 관리자 세션 검증 */
async function checkSession(): Promise<boolean> {
  const token = sessionStorage.getItem('adm_token')
  if (!token) return false
  try {
    const res = await fetch('/api/auth', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)

  // 마운트 시 세션 토큰 검증
  useEffect(() => {
    checkSession().then(setIsAdmin)
  }, [])

  const login = async (pw: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (!res.ok) return false
      const data = await res.json() as { token: string }
      sessionStorage.setItem('adm_token', data.token)
      setIsAdmin(true)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setIsAdmin(false)
    sessionStorage.removeItem('adm_token')
  }

  const changePassword = async (_currentPw: string, newPw: string) => {
    const token = sessionStorage.getItem('adm_token')
    if (!token) return false
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPw }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  const requestPasswordReset = useCallback(async () => {
    try {
      const res = await fetch('/api/auth?reset=1')
      const data = await res.json() as { ok?: boolean; maskedEmail?: string; error?: string }
      return { ok: res.ok, maskedEmail: data.maskedEmail, error: data.error }
    } catch {
      return { ok: false, error: '서버 오류가 발생했습니다' }
    }
  }, [])

  const confirmPasswordReset = async (otp: string, newPw: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, newPassword: newPw }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      return { ok: res.ok, error: data.error }
    } catch {
      return { ok: false, error: '서버 오류가 발생했습니다' }
    }
  }

  return <Ctx.Provider value={{ isAdmin, login, logout, changePassword, requestPasswordReset, confirmPasswordReset }}>{children}</Ctx.Provider>
}

export const useAdmin = () => useContext(Ctx)
