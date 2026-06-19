// BGM 스타일 선택 + 미리듣기 컴포넌트
"use client"
import { useState } from "react"
import { getBgmSampleUrl } from "@/lib/api"

const BGM_META: Record<string, { label: string; desc: string; gradient: string }> = {
  none: {
    label: "없음",
    desc: "BGM 없이 음성만",
    gradient: "linear-gradient(160deg,#1a1a1e,#2c2c32)",
  },
  calm: {
    label: "잔잔한",
    desc: "C major 패드 — 편안한 분위기",
    gradient: "linear-gradient(160deg,#0a1a2e,#1a4a6f,#50a0c8)",
  },
  energetic: {
    label: "에너제틱",
    desc: "128bpm — 활기찬 배경음",
    gradient: "linear-gradient(160deg,#2a0a0a,#6a1a1a,#b84a4a)",
  },
  cinematic: {
    label: "시네마틱",
    desc: "저음 패드 — 웅장한 분위기",
    gradient: "linear-gradient(160deg,#0a0a2a,#1a1a6a,#4a4ab8)",
  },
  upbeat: {
    label: "업비트",
    desc: "140bpm — 밝고 경쾌한 리듬",
    gradient: "linear-gradient(160deg,#0a2a0a,#1a6a1a,#4ab84a)",
  },
}

let _sampleAudio: HTMLAudioElement | null = null
function stopSampleAudio() {
  if (_sampleAudio) {
    _sampleAudio.pause()
    _sampleAudio = null
  }
}

export function BgmSelector({
  bgmStyle,
  setBgmStyle,
}: {
  bgmStyle: string
  setBgmStyle: (v: string) => void
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {Object.entries(BGM_META).map(([key, meta]) => {
        const active = bgmStyle === key
        return (
          <BgmCard
            key={key}
            bgmKey={key}
            meta={meta}
            active={active}
            onSelect={() => setBgmStyle(key)}
          />
        )
      })}
    </div>
  )
}

function BgmCard({
  bgmKey,
  meta,
  active,
  onSelect,
}: {
  bgmKey: string
  meta: { label: string; desc: string; gradient: string }
  active: boolean
  onSelect: () => void
}) {
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing">("idle")

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (bgmKey === "none") return
    if (audioState === "loading") return
    if (audioState === "playing") {
      stopSampleAudio()
      setAudioState("idle")
      return
    }
    stopSampleAudio()
    setAudioState("loading")
    const a = new Audio(getBgmSampleUrl(bgmKey))
    _sampleAudio = a
    a.onended = () => setAudioState("idle")
    a.onerror = () => setAudioState("idle")
    a.play()
      .then(() => setAudioState("playing"))
      .catch(() => setAudioState("idle"))
  }

  return (
    <button
      onClick={onSelect}
      style={{
        flex: 1,
        padding: 0,
        background: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        border: `1px solid ${active ? "rgba(107,106,255,0.5)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: active
          ? "0 0 0 1px rgba(107,106,255,0.15), 0 8px 24px rgba(107,106,255,0.12)"
          : "0 1px 3px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.transform = "translateY(-3px)"
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.45)"
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.borderColor = "var(--border)"
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.15)"
        }
      }}
    >
      <div style={{
        height: 52,
        background: `linear-gradient(160deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0) 100%),${meta.gradient}`,
        position: "relative",
      }}>
        {active && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#fff",
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(107,106,255,0.4)",
            }}
          >
            ✓
          </div>
        )}
      </div>
      <div style={{
        padding: "10px 12px",
        background: "rgba(24,24,27,0.95)",
        textAlign: "left",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p style={{
            flex: 1, fontSize: 12, fontWeight: 700,
            color: active ? "var(--accent)" : "var(--text-primary)",
            margin: "0 0 1px", transition: "color 0.2s",
          }}>
            {meta.label}
          </p>
          {bgmKey !== "none" && (
            <div
              role="button"
              tabIndex={0}
              onClick={handlePlay}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handlePlay(e as unknown as React.MouseEvent) }}
              title="미리 듣기"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: audioState === "playing" ? "var(--accent-soft)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${audioState === "playing" ? "rgba(107,106,255,0.4)" : "var(--border)"}`,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 9,
                transition: "all 0.15s ease",
                padding: 0,
              }}
            >
              {audioState === "loading" ? (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              ) : audioState === "playing" ? (
                "■"
              ) : (
                "▶"
              )}
            </div>
          )}
        </div>
        <p style={{ fontSize: 10, color: "var(--text-tertiary)", margin: 0 }}>{meta.desc}</p>
      </div>
    </button>
  )
}
