// 홈: 스크립트 입력 및 영상 생성 설정 페이지
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { startGenerate } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  const [script, setScript] = useState("")
  const [voice, setVoice] = useState("alloy")
  const [imageStyle, setImageStyle] = useState("realistic")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const jobId = await startGenerate({ script, voice, image_style: imageStyle })
      router.push(`/generating/${jobId}`)
    } catch (err) {
      setError("요청 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-2">Shorts Generator</h1>
      <p className="text-gray-400 mb-8">스크립트를 입력하면 AI가 쇼츠를 만들어드립니다</p>
      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4">
        <textarea
          className="w-full h-48 bg-gray-800 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="쇼츠로 만들 스크립트를 입력하세요..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
          required
        />
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">목소리</label>
            <select
              className="w-full bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="nova">Nova</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">이미지 스타일</label>
            <select
              className="w-full bg-gray-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value)}
            >
              <option value="realistic">사실적</option>
              <option value="animation">애니메이션</option>
              <option value="minimal">미니멀</option>
            </select>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !script.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl p-4 font-semibold transition-colors"
        >
          {loading ? "요청 중..." : "쇼츠 만들기 →"}
        </button>
      </form>
    </main>
  )
}
