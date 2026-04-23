import { createContext, useContext, useState } from 'react'

interface AdminCtx {
  isAdmin: boolean
  login: (pw: string) => boolean
  logout: () => void
  changePassword: (currentPw: string, newPw: string) => boolean
}

const Ctx = createContext<AdminCtx>({ isAdmin: false, login: () => false, logout: () => {}, changePassword: () => false })

const DEFAULT_PW = '1111'
const PW_KEY = 'adm_pw'

function getStoredPw() {
  return localStorage.getItem(PW_KEY) ?? DEFAULT_PW
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('adm') === '1')

  const login = (pw: string) => {
    if (pw !== getStoredPw()) return false
    setIsAdmin(true)
    sessionStorage.setItem('adm', '1')
    return true
  }

  const logout = () => {
    setIsAdmin(false)
    sessionStorage.removeItem('adm')
  }

  const changePassword = (currentPw: string, newPw: string) => {
    if (currentPw !== getStoredPw()) return false
    localStorage.setItem(PW_KEY, newPw)
    return true
  }

  return <Ctx.Provider value={{ isAdmin, login, logout, changePassword }}>{children}</Ctx.Provider>
}

export const useAdmin = () => useContext(Ctx)
