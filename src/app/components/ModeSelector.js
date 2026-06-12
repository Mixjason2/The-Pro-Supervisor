/**
 * ModeSelector.js — เลือก analysis mode (Minimum / Medium / Max)
 * ══════════════════════════════════════════════════════════════════
 *
 * Features:
 *   - Minimum: free (ไม่ต้อง key)
 *   - Medium / Max: ต้อง unlock ด้วย key ก่อนใช้งาน
 *   - state unlocked แยกต่อ mode ไม่ reset เมื่อ mode อื่น unlock
 *   - Enter key ใน input → tryUnlock ทันที
 *
 * Props:
 *   mode     — string  current active mode
 *   setMode  — fn(mode: string)
 */

"use client";

import { useState } from "react";

// ── Mode config ────────────────────────────────────────────────────
const MODES = [
  {
    id:    "minimum",
    label: "Minimum",
    badge: "free",
    desc:  "ประเมินคร่าวๆ คะแนน sentiment ชม/ติ สรุปสั้น",
    key:   null,           // ไม่ต้อง key
  },
  {
    id:    "medium",
    label: "Medium",
    badge: "key required",
    desc:  "วิเคราะห์หลายด้าน aspect เชื่อมโยง จุดบกพร่อง",
    key:   "MEDIUM123",
  },
  {
    id:    "max",
    label: "Max + AI Chat",
    badge: "key required",
    desc:  "วิเคราะห์เชิงลึก + AI ถาม-ตอบ real-time",
    key:   "MAX999",
  },
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ModeSelector({ mode, setMode }) {
  // input value ต่อ mode id
  const [inputs,   setInputs]   = useState({ medium: "", max: "" });
  // unlock status ต่อ mode id
  const [unlocked, setUnlocked] = useState({ minimum: true, medium: false, max: false });
  // error message ต่อ mode id
  const [errors,   setErrors]   = useState({ medium: "", max: "" });
  // press animation state ต่อ mode id
  const [pressing, setPressing] = useState({});

  /** ลอง unlock mode ด้วย key ที่ผู้ใช้กรอก */
  function tryUnlock(id, correctKey) {
    const val = (inputs[id] ?? "").trim();
    if (!val) {
      setErrors((p) => ({ ...p, [id]: "กรุณาใส่ key ก่อน" }));
      return;
    }
    if (val === correctKey) {
      setUnlocked((p) => ({ ...p, [id]: true }));
      setErrors((p)   => ({ ...p, [id]: "" }));
      setMode(id);
    } else {
      setErrors((p)  => ({ ...p, [id]: "Key ไม่ถูกต้อง ลองใหม่" }));
      setInputs((p)  => ({ ...p, [id]: "" }));
    }
  }

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12, marginBottom: "1.5rem",
      fontFamily: "'Sarabun', sans-serif",
    }}>
      {MODES.map((m) => {
        const isUnlocked = unlocked[m.id];
        const isActive   = mode === m.id;
        const isPressed  = pressing[m.id];

        return (
          <div
            key={m.id}
            onClick={() => isUnlocked && setMode(m.id)}
            onMouseDown={() => isUnlocked && setPressing((p) => ({ ...p, [m.id]: true }))}
            onMouseUp={() => setPressing((p) => ({ ...p, [m.id]: false }))}
            onMouseLeave={() => setPressing((p) => ({ ...p, [m.id]: false }))}
            style={{
              background:  isActive ? "#fdf6ec" : "#fff",
              border:      isActive ? "2px solid #D08E37" : "1px solid #e8e4e0",
              borderRadius: 16, padding: "14px 16px",
              cursor:    isUnlocked ? "pointer" : "default",
              opacity:   isUnlocked ? 1 : 0.75,
              transform: isPressed ? "scale(0.97)" : "scale(1)",
              transition: "border 0.15s, background 0.15s, transform 0.1s, box-shadow 0.15s",
              boxShadow: isActive
                ? "0 0 0 3px rgba(208,142,55,0.15)"
                : isUnlocked ? "0 1px 4px rgba(37,40,50,0.06)" : "none",
              userSelect: "none", position: "relative",
            }}
          >
            {/* Active check badge */}
            {isActive && (
              <div style={{
                position: "absolute", top: 10, right: 12,
                width: 18, height: 18, borderRadius: "50%",
                background: "#D08E37",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff", fontWeight: 700,
              }}>
                ✓
              </div>
            )}

            {/* Badge (free / key required) */}
            <span style={{
              display: "inline-block", fontSize: 11,
              padding: "2px 9px", borderRadius: 20, marginBottom: 8,
              background: m.key ? "#fdf3e7" : "#edf7ee",
              color:      m.key ? "#8a5a1a" : "#2a6b30",
              fontWeight: 500,
            }}>
              {m.badge}
            </span>

            {/* Label + description */}
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: isActive ? "#D08E37" : "#252832" }}>
              {m.label}
            </div>
            <div style={{ fontSize: 12, color: "#8a7f72", lineHeight: 1.5, marginBottom: isUnlocked ? 0 : 10 }}>
              {m.desc}
            </div>

            {/* Lock UI — แสดงเมื่อยังไม่ unlock */}
            {!isUnlocked && (
              <>
                <div style={{
                  background: "#faf9f8", border: "1px dashed #d9d4ce",
                  borderRadius: 10, padding: "8px 10px", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  <span style={{ fontSize: 11, color: "#a89c8e" }}>ต้องใช้ key เพื่อปลดล็อค</span>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="password"
                    placeholder="Enter key..."
                    value={inputs[m.id] ?? ""}
                    onChange={(e) => {
                      setInputs((p) => ({ ...p, [m.id]: e.target.value }));
                      setErrors((p) => ({ ...p, [m.id]: "" }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.stopPropagation(); tryUnlock(m.id, m.key); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1, fontSize: 12, padding: "6px 9px",
                      border: errors[m.id] ? "1.5px solid #AA4A39" : "1px solid #d9d4ce",
                      borderRadius: 8, background: "#faf9f8", color: "#252832",
                      outline: "none", transition: "border 0.15s",
                      fontFamily: "'Sarabun', sans-serif",
                    }}
                  />
                  <UnlockButton onClick={(e) => { e.stopPropagation(); tryUnlock(m.id, m.key); }} />
                </div>

                {errors[m.id] && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#AA4A39", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>✕</span> {errors[m.id]}
                  </div>
                )}
              </>
            )}

            {/* Unlocked badge (สำหรับ medium/max หลัง unlock) */}
            {isUnlocked && m.key && (
              <div style={{
                marginTop: 8, fontSize: 11, color: "#2a6b30",
                background: "#edf7ee", borderRadius: 6,
                padding: "3px 8px", display: "inline-block",
              }}>
                ✓ ปลดล็อคแล้ว
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// SUB COMPONENT — Unlock Button
// ══════════════════════════════════════════════════════════════════

function UnlockButton({ onClick }) {
  const [hover,   setHover]   = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        fontSize: 11, padding: "6px 10px",
        border: "1px solid #D08E37", borderRadius: 8,
        background: pressed ? "#9e6827" : hover ? "#D08E37" : "transparent",
        color:      pressed || hover ? "#fff" : "#D08E37",
        cursor: "pointer", fontWeight: 600,
        fontFamily: "'Sarabun', sans-serif",
        transform: pressed ? "scale(0.95)" : "scale(1)",
        transition: "background 0.1s, color 0.1s, transform 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      Unlock
    </button>
  );
}