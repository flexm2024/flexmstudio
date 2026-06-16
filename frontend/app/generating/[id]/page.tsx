// 영상 생성 진행 상황을 SSE로 실시간 표시하는 페이지
"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getStatusEventSource } from "@/lib/api"

const STEP_LABELS: Record<string, string> = {
  pending: "대기 중",
  parsing: "스크립트 분석",
  generating_images: "이미지 생성",
  generating_audio: "음성 생성",
  assembling: "영상 합성",
  done: "완료",
}

export default function GeneratingPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("시작 중...")
  const [status, setStatus] = useState("pending")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const es = getStatusEventSource(id)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setProgress(data.progress ?? 0)
      setMessage(data.message ?? "")
      setStatus(data.status ?? "pending")
      if (data.status === "done") {
        es.close()
        router.push(`/result/${id}`)
      }
      if (data.status === "error") {
        es.close()
        setErrorMsg(data.error ?? "알 수 없는 오류")
      }
    }
    es.onerror = () => {
      setErrorMsg("서버 연결이 끊어졌습니다.")
      es.close()
    }
    return () => es.close()
  }, [id, router])

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-2">쇼츠 생성 중...</h1>
      <p className="text-gray-400 mb-10">{STEP_LABELS[status] ?? status}</p>
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-full h-3 mb-4">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>{message}</span>
          <span>{progress}%</span>
        </div>
      </div>
      {errorMsg && (
        <div className="mt-8 bg-red-900/40 border border-red-500 rounded-xl p-4 max-w-md w-full">
          <p className="text-red-400 font-semibold">오류 발생</p>
          <p className="text-red-300 text-sm mt-1">{errorMsg}</p>
        </div>
      )}
    </main>
  )
}
