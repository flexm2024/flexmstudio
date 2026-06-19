// 이미지 스타일 선택 카드 컴포넌트
"use client"

const STYLE_META: Record<string, { label: string; desc: string; gradient: string }> = {
  realistic: {
    label: "사실적",
    desc: "실제 사진처럼 디테일하게",
    gradient: "linear-gradient(160deg,#0d2818,#1a4a35,#3d7a5a,#b89464)",
  },
  animation: {
    label: "애니",
    desc: "일러스트·만화 스타일로",
    gradient: "linear-gradient(160deg,#1a0533,#4a1590,#c435c0,#ff9f43)",
  },
  minimal: {
    label: "미니멀",
    desc: "깔끔하고 단순하게",
    gradient: "linear-gradient(160deg,#111,#222,#4a4a4a,#888)",
  },
}

export function StyleCards({
  imageStyle,
  setImageStyle,
}: {
  imageStyle: string
  setImageStyle: (v: string) => void
}) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {Object.entries(STYLE_META).map(([key, meta]) => {
        const active = imageStyle === key
        return (
          <button
            key={key}
            onClick={() => setImageStyle(key)}
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
                e.currentTarget.style.transform = "translateY(-4px)"
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
              height: 72,
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
              <p style={{
                fontSize: 12, fontWeight: 700,
                color: active ? "var(--accent)" : "var(--text-primary)",
                margin: "0 0 2px", transition: "color 0.2s",
              }}>
                {meta.label}
              </p>
              <p style={{
                fontSize: 10, color: "var(--text-tertiary)", margin: 0,
              }}>{meta.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
