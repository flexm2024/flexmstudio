// 목소리 선택 및 샘플 재생 컴포넌트
"use client"
import { useEffect, useRef, useState } from "react"
import { getVoiceSampleUrl } from "@/lib/api"

const VOICES_F = [
  { v: "alloy", l: "Alloy", d: "차분하고 안정적인" },
  { v: "nova", l: "Nova", d: "따뜻하고 친근한" },
  { v: "shimmer", l: "Shimmer", d: "밝고 활기찬" },
]
const VOICES_M = [
  { v: "echo", l: "Echo", d: "또렷하고 밝은" },
  { v: "onyx", l: "Onyx", d: "깊고 중후한" },
  { v: "fable", l: "Fable", d: "부드럽고 서정적인" },
]
const VOICES = [...VOICES_F, ...VOICES_M]

let _sampleAudio: HTMLAudioElement | null = null
function stopSampleAudio() {
  if (_sampleAudio) {
    _sampleAudio.pause()
    _sampleAudio = null
  }
}

export { VOICES_F, VOICES_M, VOICES }

export function VoiceSelector({
  voice,
  setVoice,
}: {
  voice: string
  setVoice: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = VOICES.find((x) => x.v === voice)!

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px 5px 10px",
          background: open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          cursor: "pointer",
          fontFamily: "inherit",
          color: "#f5f5f7",
          fontSize: 12,
          fontWeight: 600,
          transition: "all 0.15s",
        }}
      >
        <span>🎙</span>
        <span>{current.l}</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 200,
            background: "rgba(20,20,24,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 5,
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
            width: 260,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 4px 6px",
            }}
          >
            목소리 선택
          </p>
          {VOICES.map(({ v, l, d }) => (
            <VoiceCard
              key={v}
              voice={v}
              label={l}
              desc={d}
              active={voice === v}
              onSelect={() => {
                setVoice(v)
                setOpen(false)
              }}
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function VoiceSelectorRow({
  voice,
  setVoice,
}: {
  voice: string
  setVoice: (v: string) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[VOICES_F, VOICES_M].map((group, gi) => (
        <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            {gi === 0 ? "여성" : "남성"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {group.map(({ v, l, d }) => (
              <VoiceCard key={v} voice={v} label={l} desc={d} active={voice === v} onSelect={() => setVoice(v)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function VoiceCard({
  voice,
  label,
  desc,
  active,
  onSelect,
  compact,
}: {
  voice: string
  label: string
  desc: string
  active: boolean
  onSelect: () => void
  compact?: boolean
}) {
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing">("idle")

  useEffect(() => () => {
    stopSampleAudio()
    setAudioState("idle")
  }, [])

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (audioState === "loading") return
    if (audioState === "playing") {
      stopSampleAudio()
      setAudioState("idle")
      return
    }
    stopSampleAudio()
    setAudioState("loading")
    const a = new Audio(getVoiceSampleUrl(voice))
    _sampleAudio = a
    a.onended = () => setAudioState("idle")
    a.onerror = () => setAudioState("idle")
    a.play()
      .then(() => setAudioState("playing"))
      .catch(() => setAudioState("idle"))
  }

  const borderColor = active
    ? "rgba(107,106,255,0.4)"
    : "var(--border)"
  const bg = active ? "var(--accent-soft)" : "rgba(24,24,27,0.95)"

  return (
    <button
      onClick={onSelect}
      style={{
        width: compact ? "100%" : "auto",
        flex: compact ? "1" : "none",
        padding: compact ? "10px 12px" : "10px 12px",
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
        textAlign: "left",
        boxShadow: active ? "0 4px 12px rgba(107,106,255,0.1)" : "0 1px 2px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)" } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)" } }}
    >
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 700,
          color: active ? "var(--accent)" : "var(--text-primary)",
          margin: "0 0 2px", transition: "color 0.2s",
        }}>
          {label}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>{desc}</p>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={handlePlay}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handlePlay(e as unknown as React.MouseEvent) }}
        title="샘플 재생"
        style={{
          width: 28,
          height: 28,
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
    </button>
  )
}
