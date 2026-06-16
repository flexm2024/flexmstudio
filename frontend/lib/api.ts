// 백엔드 API 호출 함수 모음
const API_BASE = "http://localhost:8000"

export async function startGenerate(params: {
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
