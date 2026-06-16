// 완성된 영상 미리보기 및 소셜 미디어 업로드 페이지
"use client"
import { useState } from "react"
import { useParams } from "next/navigation"
import { uploadVideo, getVideoUrl } from "@/lib/api"

const PLATFORMS = [
  { id: "youtube", label: "YouTube Shorts" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram Reels" },
]

export default function ResultPage() {
  const params = useParams()
  const id = params.id as string
  const [selected, setSelected] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<Record<string, string>>({})
  const [uploadError, setUploadError] = useState("")

  function togglePlatform(platform: string) {
    setSelected((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  async function handleUpload() {
    setUploading(true)
    setUploadError("")
    try {
      const res = await uploadVideo(id, selected)
      setResults(res)
    } catch {
      setUploadError("업로드 중 오류가 발생했습니다.")
    } finally {
      setUploading(false)
    }
  }

  const videoUrl = getVideoUrl(id)

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8 pt-16">
      <h1 className="text-2xl font-bold mb-8">쇼츠 완성!</h1>
      <video
        src={videoUrl}
        controls
        className="rounded-2xl mb-8 shadow-2xl"
        style={{ height: "55vh", aspectRatio: "9/16" }}
      />
      <div className="w-full max-w-sm mb-6">
        <p className="text-gray-400 text-sm mb-3">업로드할 플랫폼 선택</p>
        <div className="flex flex-col gap-3">
          {PLATFORMS.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 cursor-pointer bg-gray-800 rounded-xl px-4 py-3 hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => togglePlatform(p.id)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="flex-1">{p.label}</span>
              {results[p.id] && (
                <span className="text-green-400 text-xs truncate max-w-[120px]" title={results[p.id]}>
                  ✓ 업로드됨
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
      {uploadError && <p className="text-red-400 text-sm mb-4">{uploadError}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={uploading || selected.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl px-6 py-3 font-semibold transition-colors"
        >
          {uploading ? "업로드 중..." : "업로드"}
        </button>
        <a
          href={videoUrl}
          download="shorts.mp4"
          className="bg-gray-700 hover:bg-gray-600 rounded-xl px-6 py-3 font-semibold transition-colors"
        >
          다운로드
        </a>
      </div>
    </main>
  )
}
