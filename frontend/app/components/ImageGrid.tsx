// 생성된 이미지 그리드 + 라이트박스 + 개별 재생성
"use client"
import { useState } from "react"
import { getJobImageUrl, regenerateImage } from "@/lib/api"
import type { JobInfo } from "@/lib/api"
import { Gray } from "./ui"

export function ImageGrid({
  jobId,
  jobInfo,
  cacheBust,
  setCacheBust,
}: {
  jobId: string
  jobInfo: JobInfo | null
  cacheBust: Record<number, number>
  setCacheBust: React.Dispatch<React.SetStateAction<Record<number, number>>>
}) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [regenLoading, setRegenLoading] = useState<Set<number>>(new Set())

  async function handleRegen(e: React.MouseEvent, i: number) {
    e.stopPropagation()
    setRegenLoading((prev) => new Set(prev).add(i))
    try {
      await regenerateImage(jobId, i)
      setCacheBust((prev) => ({ ...prev, [i]: Date.now() }))
    } catch {
      /* empty */
    } finally {
      setRegenLoading((prev) => {
        const s = new Set(prev)
        s.delete(i)
        return s
      })
    }
  }

  if (!jobInfo || jobInfo.image_count === 0) return <Gray>이미지 생성 전입니다.</Gray>

  return (
    <>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {Array.from({ length: jobInfo.image_count }).map((_, i) => {
          const loading = regenLoading.has(i)
          const imgUrl = getJobImageUrl(jobId, i) + (cacheBust[i] ? `?t=${cacheBust[i]}` : "")
          return (
            <div key={i} style={{ position: "relative" }}>
              <button
                onClick={() => setLightbox(i)}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  outline: "2px solid transparent",
                  outlineColor: "transparent",
                  transition: "outline 0.2s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s",
                  display: "block",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  transform: "translateY(0)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.5)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"
                }}
              >
                {loading ? (
                  <div
                    style={{
                      width: 180,
                      aspectRatio: "9/16",
                      background: "rgba(24,24,27,0.9)",
                      borderRadius: "var(--radius-lg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        border: "2px solid rgba(255,255,255,0.1)",
                        borderTopColor: "var(--accent)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={imgUrl}
                    alt={`씬 ${i + 1}`}
                    style={{ width: 180, aspectRatio: "9/16", objectFit: "cover", display: "block" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent,rgba(0,0,0,0.75))",
                    padding: "20px 8px 8px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", opacity: 0.85 }}>씬 {i + 1}</span>
                </div>
              </button>
              <button
                onClick={(e) => handleRegen(e, i)}
                disabled={loading}
                title="이미지 재생성"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: loading ? 0.4 : 1,
                  transition: "all 0.15s ease",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(107,106,255,0.4)"; e.currentTarget.style.borderColor = "rgba(107,106,255,0.5)" } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" } }}
              >
                ↺
              </button>
            </div>
          )
        })}
      </div>

      {/* 라이트박스 */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            padding: 32,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightbox((l) => (l !== null && l > 0 ? l - 1 : l))
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              backdropFilter: "blur(12px)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
          >
            ‹
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, maxHeight: "90vh" }}
          >
            <div style={{
              position: "relative",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
            }}>
              <img
                src={getJobImageUrl(jobId, lightbox) + (cacheBust[lightbox] ? `?t=${cacheBust[lightbox]}` : "")}
                alt=""
                style={{
                  maxHeight: "70vh",
                  maxWidth: "min(480px,80vw)",
                  aspectRatio: "9/16",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                {lightbox + 1} / {jobInfo.image_count}
              </span>
              <button
                onClick={(e) => handleRegen(e, lightbox)}
                disabled={regenLoading.has(lightbox)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  background: "var(--accent-soft)",
                  border: "1px solid rgba(107,106,255,0.35)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: regenLoading.has(lightbox) ? "not-allowed" : "pointer",
                  opacity: regenLoading.has(lightbox) ? 0.5 : 1,
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                {regenLoading.has(lightbox) ? (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(107,106,255,0.2)",
                      borderTopColor: "var(--accent)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  "↺"
                )}{" "}
                재생성
              </button>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.2)",
                fontStyle: "italic",
                margin: 0,
                maxWidth: 400,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {jobInfo.scenes?.[lightbox]?.narration}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightbox((l) => (l !== null && l < jobInfo.image_count - 1 ? l + 1 : l))
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              backdropFilter: "blur(12px)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
          >
            ›
          </button>

          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              backdropFilter: "blur(12px)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
