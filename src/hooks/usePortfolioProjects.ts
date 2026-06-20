import { useState, useCallback, useEffect, useRef } from 'react'
import type { ProjectDetail } from '../components/PortfolioModal'
import { PORTFOLIO_KEY, PORTFOLIO_SEEDS, categoryColor } from '../data/portfolio'

export { categoryColor }

export interface Project extends ProjectDetail {
  id: string
}

const SEED_IDS = new Set(PORTFOLIO_SEEDS.map(s => s.id))

function loadCache(): Project[] {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY)
    if (raw) return JSON.parse(raw) as Project[]
  } catch {}
  return PORTFOLIO_SEEDS as Project[]
}

function getToken() {
  return sessionStorage.getItem('adm_token') ?? ''
}

export function usePortfolioProjects() {
  const [projects, setProjects] = useState<Project[]>(loadCache)
  const lastWriteRef = useRef(0)

  const syncFromServer = useCallback(async () => {
    if (Date.now() - lastWriteRef.current < 5000) return
    try {
      const data: Project[] = await fetch('/api/portfolio').then(r => r.json())
      if (data.length === 0) {
        const raw = localStorage.getItem(PORTFOLIO_KEY)
        if (raw) {
          const local = JSON.parse(raw) as Project[]
          const hasExtra = local.some(p => !SEED_IDS.has(p.id))
          if (hasExtra) {
            await fetch('/api/portfolio?migrate=1', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(local),
            })
            setProjects(local)
            localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(local))
          }
        }
        return
      }
      // 로컬에는 있지만 서버에 아직 반영 안 된 프로젝트 병합 (optimistic write 보존)
      const localRaw = localStorage.getItem(PORTFOLIO_KEY)
      if (localRaw) {
        const local = JSON.parse(localRaw) as Project[]
        const serverIds = new Set(data.map(p => p.id))
        for (const p of local) {
          if (!serverIds.has(p.id)) data.push(p)
        }
      }
      setProjects(data)
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data))
    } catch (e) { console.error('Portfolio sync failed:', e) }
  }, [])

  useEffect(() => {
    syncFromServer()
    const onVisibility = () => { if (document.visibilityState === 'visible') syncFromServer() }
    document.addEventListener('visibilitychange', onVisibility)
    const interval = setInterval(syncFromServer, 30_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(interval)
    }
  }, [syncFromServer])

  const addProject = useCallback((draft: Omit<Project, 'id'>) => {
    const next: Project = { ...draft, id: Date.now().toString() }
    lastWriteRef.current = Date.now()
    setProjects(prev => {
      const updated = [next, ...prev]
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated))
      return updated
    })
    fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(next),
    }).catch(console.error)
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Omit<Project, 'id'>>) => {
    lastWriteRef.current = Date.now()
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...patch } : p)
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated))
      return updated
    })
    fetch(`/api/portfolio?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(patch),
    }).catch(console.error)
  }, [])

  const deleteProject = useCallback((id: string) => {
    lastWriteRef.current = Date.now()
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id)
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated))
      return updated
    })
    fetch(`/api/portfolio?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(console.error)
  }, [])

  return { projects, addProject, updateProject, deleteProject }
}
