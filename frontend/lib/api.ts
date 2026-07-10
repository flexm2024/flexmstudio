// 백엔드 API 호출 함수 모음
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"

export async function startGenerate(params: {
  title?: string
  script: string
  voice: string
  image_style: string
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error("생성 요청 실패")
  const { job_id } = await res.json()
  return job_id
}

export async function uploadVideo(
  jobId: string,
  platforms: string[]
): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/api/upload/${jobId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platforms }),
  })
  if (!res.ok) throw new Error("업로드 실패")
  const { results } = await res.json()
  return results
}

export function getVideoUrl(jobId: string): string {
  return `${API_BASE}/api/video/${jobId}`
}

export function getStatusEventSource(jobId: string): EventSource {
  return new EventSource(`${API_BASE}/api/status/${jobId}`)
}

export interface JobSummary {
  job_id: string
  title: string
  status: string
  created_at: string
  progress: number
}

export async function listJobs(): Promise<JobSummary[]> {
  const res = await fetch(`${API_BASE}/api/jobs`)
  if (!res.ok) return []
  const { jobs } = await res.json()
  return jobs
}

export interface JobInfo {
  script: string
  scenes: { narration: string; image_prompt: string; duration_estimate: number; subtitle_chunks?: string[] }[]
  image_count: number
  audio_count: number
  subtitle_align?: string
}

export async function updateSubtitleAlign(jobId: string, align: string): Promise<void> {
  await fetch(`${API_BASE}/api/job/${jobId}/subtitle_align`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ align }),
  })
}

export async function updateSceneChunks(jobId: string, idx: number, chunks: string[]): Promise<void> {
  await fetch(`${API_BASE}/api/job/${jobId}/scene/${idx}/subtitle_chunks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chunks }),
  })
}

export async function getJobInfo(jobId: string): Promise<JobInfo | null> {
  const res = await fetch(`${API_BASE}/api/job/${jobId}/info`)
  if (!res.ok) return null
  return res.json()
}

export function getJobImageUrl(jobId: string, idx: number): string {
  return `${API_BASE}/api/job/${jobId}/image/${idx}`
}

export function getJobAudioUrl(jobId: string, idx: number): string {
  return `${API_BASE}/api/job/${jobId}/audio/${idx}`
}

export async function createDraft(title: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/job/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error("드래프트 생성 실패")
  const { job_id } = await res.json()
  return job_id
}

export async function runJob(jobId: string, params: { title: string; script: string; voice: string; image_style: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/job/${jobId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error("실행 실패")
}

export async function generateScript(title: string, keywords: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, keywords }),
  })
  if (!res.ok) throw new Error("스크립트 생성 실패")
  const { script } = await res.json()
  return script
}

export async function triggerRender(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/job/${jobId}/render`, { method: "POST" })
  if (!res.ok) throw new Error("렌더 시작 실패")
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/job/${jobId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("삭제 실패")
}

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/job/${jobId}/cancel`, { method: "POST" })
  if (!res.ok) throw new Error("취소 실패")
}

export function getVoiceSampleUrl(voice: string): string {
  return `${API_BASE}/api/sample/voice/${voice}`
}

export async function regenerateImage(jobId: string, idx: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/job/${jobId}/image/${idx}/regenerate`, { method: "POST" })
  if (!res.ok) throw new Error("이미지 재생성 실패")
}
