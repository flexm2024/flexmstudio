// 파이프라인 단계별 상세 내용 탭
"use client"
import { useEffect, useState } from "react"
import {
  getJobInfo,
  getJobImageUrl,
  getJobAudioUrl,
  updateSceneChunks,
  updateSubtitleAlign,
} from "@/lib/api"
import type { JobInfo } from "@/lib/api"
import { Gray } from "./ui"
import { ImageGrid } from "./ImageGrid"

function splitToChunks(text: string): string[] {
  const sentences = text.trim().split(/(?<=[.!?。])\s*/).filter((s) => s.trim())
  const base = sentences.length > 0 ? sentences : [text.trim()]
  const chunks: string[] = []
  for (const sent of base) {
    const parts = sent.split(/(?<=[,，])\s*/).filter((p) => p.trim())
    chunks.push(...(parts.length > 0 ? parts : [sent.trim()]))
  }
  return chunks.filter((c) => c).length > 0 ? chunks.filter((c) => c) : [text.trim()]
}

export function TabContent({
  tab,
  jobId,
  jobInfo,
  stepStatus,
  progress,
  message,
  videoUrl,
  onRender,
  renderLoading,
  imageStyle,
  setImageStyle,
}: {
  tab: string
  jobId: string
  jobInfo: JobInfo | null
  stepStatus: string
  progress: number
  message: string
  videoUrl: string | null
  onRender: () => void
  renderLoading: boolean
  imageStyle: string
  setImageStyle: (v: string) => void
}) {
  const [cacheBust, setCacheBust] = useState<Record<number, number>>({})
  const [chunkEdits, setChunkEdits] = useState<Record<number, string[]>>({})
  const [subtitleAlign, setSubtitleAlign] = useState<string>("center")
  useEffect(() => {
    if (jobInfo?.subtitle_align) setSubtitleAlign(jobInfo.subtitle_align)
  }, [jobInfo?.subtitle_align])

  if (tab === "title")
    return (
      <div style={{ maxWidth: 560 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 12px",
          }}
        >
          원본 스크립트
        </p>
        <div style={{
          background: "rgba(24,24,27,0.7)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "18px 20px",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
            {jobInfo?.script ?? <span style={{ color: "var(--text-tertiary)" }}>로딩 중...</span>}
          </p>
        </div>
      </div>
    )

  if (tab === "parsing")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
        {jobInfo?.scenes?.map((scene, i) => (
          <div
            key={i}
            style={{
              background: "rgba(24,24,27,0.7)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 18px",
              animation: "fadeIn 0.3s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)" }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.15)" }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--accent)",
                  background: "var(--accent-soft)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  flexShrink: 0,
                }}
              >
                씬 {i + 1}
              </span>
              <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.65 }}>{scene.narration}</p>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontStyle: "italic" }}>
              {scene.image_prompt}
            </p>
          </div>
        )) ?? <Gray>스크립트 분석 전입니다.</Gray>}
      </div>
    )

  if (tab === "generating_images")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 660 }}>
        <ImageGrid jobId={jobId} jobInfo={jobInfo} cacheBust={cacheBust} setCacheBust={setCacheBust} />
      </div>
    )

  if (tab === "assembling")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 580 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", flexShrink: 0 }}>자막 정렬</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(
              [
                ["left", "≡ 좌"],
                ["center", "≡ 중"],
                ["right", "우 ≡"],
              ] as const
            ).map(([v, label]) => {
              const sel = subtitleAlign === v
              return (
                <button
                  key={v}
                  onClick={async () => {
                    setSubtitleAlign(v)
                    await updateSubtitleAlign(jobId, v)
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${sel ? "rgba(107,106,255,0.4)" : "var(--border)"}`,
                    background: sel ? "var(--accent-soft)" : "transparent",
                    color: sel ? "var(--accent)" : "var(--text-tertiary)",
                    fontSize: 12,
                    fontWeight: sel ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>재렌더링 시 적용됩니다.</span>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
          클릭하여 자막을 직접 수정하세요. 저장은 입력 후 포커스 이동 시 자동 저장됩니다.
        </p>
        {jobInfo?.scenes?.map((scene, i) => {
          const chunks = chunkEdits[i] ?? scene.subtitle_chunks ?? splitToChunks(scene.narration)
          const save = async (updated: string[]) => {
            await updateSceneChunks(jobId, i, updated)
          }
          return (
            <div
              key={i}
              style={{
                background: "rgba(24,24,27,0.7)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                transition: "box-shadow 0.2s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)" }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--accent)",
                    background: "var(--accent-soft)",
                    padding: "1px 7px",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  씬 {i + 1}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{chunks.length}개 자막</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {chunks.map((chunk, ci) => (
                  <div key={ci} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-tertiary)",
                        marginTop: 6,
                        minWidth: 16,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {ci + 1}
                    </span>
                    <textarea
                      value={chunk}
                      rows={1}
                      onChange={(e) => {
                        const updated = [...chunks]
                        updated[ci] = e.target.value
                        setChunkEdits((prev) => ({ ...prev, [i]: updated }))
                        e.target.style.height = "auto"
                        e.target.style.height = e.target.scrollHeight + "px"
                      }}
                      onBlurCapture={async () => {
                        await save(chunks)
                      }}
                      style={{
                        width: 240,
                        flexShrink: 0,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "5px 8px",
                        color: "var(--text-primary)",
                        fontSize: 12,
                        lineHeight: 1.45,
                        resize: "none",
                        fontFamily: "inherit",
                        outline: "none",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(107,106,255,0.5)"
                        e.target.style.height = "auto"
                        e.target.style.height = e.target.scrollHeight + "px"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)"
                      }}
                    />
                    <button
                      onClick={async () => {
                        const updated = chunks.filter((_, j) => j !== ci)
                        setChunkEdits((prev) => ({ ...prev, [i]: updated }))
                        await save(updated)
                      }}
                      title="삭제"
                      style={{
                        marginTop: 4,
                        width: 18,
                        height: 18,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--red-soft)",
                        border: "1px solid rgba(255,69,58,0.2)",
                        color: "var(--red)",
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "inherit",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={async () => {
                    const updated = [...chunks, ""]
                    setChunkEdits((prev) => ({ ...prev, [i]: updated }))
                    await save(updated)
                  }}
                  style={{
                    marginTop: 2,
                    padding: "5px 10px",
                    background: "transparent",
                    border: "1px dashed var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-tertiary)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                >
                  + 자막 추가
                </button>
              </div>
            </div>
          )
        }) ?? <Gray>자막 정보를 불러오는 중입니다.</Gray>}
      </div>
    )

  if (tab === "generating_audio")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
        {jobInfo && jobInfo.audio_count > 0
          ? Array.from({ length: jobInfo.audio_count }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(24,24,27,0.7)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "14px 16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.3)"}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.15)"}}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--accent)",
                      background: "var(--accent-soft)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      flexShrink: 0,
                    }}
                  >
                    씬 {i + 1}
                  </span>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {jobInfo.scenes?.[i]?.narration}
                  </p>
                </div>
                <audio controls src={getJobAudioUrl(jobId, i)} style={{ width: "100%", height: 32 }} />
              </div>
            ))
          : <Gray>음성 생성 전입니다.</Gray>}
      </div>
    )

  if (tab === "rendering")
    return (
      <div style={{ maxWidth: 400 }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 16px" }}>
          {message || "영상을 렌더링 중입니다..."}
        </p>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 3 }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg,var(--accent),#5e5ce6)",
              borderRadius: 4,
              transition: "width 0.8s ease",
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>{progress}%</p>
      </div>
    )

  if (tab === "done")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>
        <div
          style={{
            background: "rgba(48,209,88,0.06)",
            border: "1px solid rgba(48,209,88,0.18)",
            borderRadius: "var(--radius-lg)",
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 0 40px rgba(48,209,88,0.04), 0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(48,209,88,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#30d158", margin: "0 0 4px" }}>영상 완료!</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
              오른쪽 미리보기에서 영상을 확인하고 다운로드하세요.
            </p>
          </div>
        </div>

        {videoUrl && (
          <a
            href={videoUrl}
            download="shorts.mp4"
            style={{
              padding: "14px",
              background: "linear-gradient(180deg,rgba(48,209,88,0.2),rgba(48,209,88,0.1))",
              border: "1px solid rgba(48,209,88,0.25)",
              borderRadius: "var(--radius-md)",
              color: "#30d158",
              fontSize: 15,
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "none",
              letterSpacing: "-0.2px",
            }}
          >
            완료 — 영상 다운로드
          </a>
        )}
      </div>
    )

  return (
    <div style={{ maxWidth: 400 }}>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 16px" }}>{message || "처리 중..."}</p>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 3 }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg,var(--accent),#5e5ce6)",
            borderRadius: 4,
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>{progress}%</p>
    </div>
  )
}
