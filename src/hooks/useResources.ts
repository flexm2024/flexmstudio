import { useState, useCallback, useEffect, useRef } from 'react'
import { type Resource, RESOURCE_KEY, RESOURCE_SEEDS, ALL_KNOWN_SEED_IDS, RESOURCE_SEED_VERSION } from '../data/resources'

export type { Resource }

const SEED_VER_KEY = 'flexm_resources_ver'

function loadCache(): Resource[] {
  try {
    if (localStorage.getItem(SEED_VER_KEY) !== RESOURCE_SEED_VERSION) {
      localStorage.removeItem(RESOURCE_KEY)
      return RESOURCE_SEEDS
    }
    const raw = localStorage.getItem(RESOURCE_KEY)
    if (raw) return JSON.parse(raw) as Resource[]
  } catch {}
  return RESOURCE_SEEDS
}

function getToken() {
  return sessionStorage.getItem('adm_token') ?? ''
}

export function useResources() {
  const [resources, setResources] = useState<Resource[]>(loadCache)
  const lastWriteRef = useRef(0)

  const syncFromServer = useCallback(async () => {
    if (Date.now() - lastWriteRef.current < 5000) return
    try {
      const data: Resource[] = await fetch('/api/resources').then(r => r.json())
      if (data.length === 0) {
        const raw = localStorage.getItem(RESOURCE_KEY)
        if (raw) {
          const local = JSON.parse(raw) as Resource[]
          const hasExtra = local.some(r => !ALL_KNOWN_SEED_IDS.has(r.id))
          if (hasExtra) {
            await fetch('/api/resources?migrate=1', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(local),
            })
            setResources(local)
            localStorage.setItem(RESOURCE_KEY, JSON.stringify(local))
          }
        }
        return
      }
      setResources(data)
      localStorage.setItem(RESOURCE_KEY, JSON.stringify(data))
      localStorage.setItem(SEED_VER_KEY, RESOURCE_SEED_VERSION)
    } catch {}
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

  const addResource = useCallback((draft: Omit<Resource, 'id'>) => {
    const next: Resource = { ...draft, id: Date.now().toString() }
    lastWriteRef.current = Date.now()
    setResources(prev => {
      const updated = [next, ...prev]
      localStorage.setItem(RESOURCE_KEY, JSON.stringify(updated))
      return updated
    })
    fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(next),
    }).catch(console.error)
  }, [])

  const updateResource = useCallback((id: string, patch: Partial<Omit<Resource, 'id'>>) => {
    lastWriteRef.current = Date.now()
    setResources(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...patch } : r)
      localStorage.setItem(RESOURCE_KEY, JSON.stringify(updated))
      return updated
    })
    fetch(`/api/resources?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(patch),
    }).catch(console.error)
  }, [])

  const deleteResource = useCallback((id: string) => {
    lastWriteRef.current = Date.now()
    setResources(prev => {
      const updated = prev.filter(r => r.id !== id)
      localStorage.setItem(RESOURCE_KEY, JSON.stringify(updated))
      return updated
    })
    fetch(`/api/resources?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(console.error)
  }, [])

  return { resources, addResource, updateResource, deleteResource }
}
