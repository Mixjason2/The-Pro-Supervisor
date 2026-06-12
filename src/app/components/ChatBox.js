/**
 * ChatBox.js — Floating AI chatbot panel
 * ══════════════════════════════════════════════════════════════════
 *
 * Features:
 *   - FAB button ที่มุมขวาล่าง เปิด/ปิด panel
 *   - Resizable panel (drag ขอบ/มุม)
 *   - Quick question chips (แสดงเฉพาะ message แรก)
 *   - Context badge แสดงเมื่อมี aspect data พร้อม
 *   - Typing indicator (animated dots)
 *   - Auto-scroll ไป message ล่าสุด
 *
 * Props:
 *   reviewText  — string
 *   aspectData  — object[] | null
 *   insightData — object[] | null
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chatWithAI } from "../services/api";

// ── Constants ──────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  "สรุปจุดเด่นของร้านนี้",
  "ควรปรับปรุงด้านไหนก่อน",
  "บริการเป็นอย่างไรบ้าง",
  "อาหารอร่อยไหม",
  "ราคาคุ้มค่าไหม",
];

const PANEL = { DEFAULT_W: 370, DEFAULT_H: 560, MIN_W: 280, MIN_H: 360, MAX_W: 680, MAX_H: 780 };
const POPUP_HIDE_DELAY = 5000;   // ms ก่อนซ่อน tooltip

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ChatBox({ reviewText, aspectData, insightData }) {
  const [open,      setOpen]      = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [messages,  setMessages]  = useState([
    { role: "ai", text: "สวัสดีครับ! ผม AI ผู้ช่วยวิเคราะห์รีวิว 🤖\nถามอะไรก็ได้เกี่ยวกับรีวิวหรือร้านนี้" },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  // resize state
  const [panelW, setPanelW] = useState(PANEL.DEFAULT_W);
  const [panelH, setPanelH] = useState(PANEL.DEFAULT_H);
  const resizingRef = useRef(null);  // { startX, startY, startW, startH, edge }

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const hasContext = !!(reviewText || aspectData);

  // ── Effects ────────────────────────────────────────────────────

  // ซ่อน popup tooltip หลัง POPUP_HIDE_DELAY ms
  useEffect(() => {
    if (!showPopup) return;
    const t = setTimeout(() => setShowPopup(false), POPUP_HIDE_DELAY);
    return () => clearTimeout(t);
  }, [showPopup]);

  // auto-scroll ไป message ล่าสุดทุกครั้งที่มี message ใหม่
  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open]);

  // auto-resize textarea ตาม content
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 90) + "px";
  }, [input]);

  // ── Resize logic ───────────────────────────────────────────────

  const onResizeStart = useCallback((e, edge) => {
    e.preventDefault();
    resizingRef.current = { startX: e.clientX, startY: e.clientY, startW: panelW, startH: panelH, edge };

    function onMove(ev) {
      const { startX, startY, startW, startH, edge: eg } = resizingRef.current;
      const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
      let w = startW, h = startH;

      if (eg.includes("left"))   w = clamp(startW - (ev.clientX - startX), PANEL.MIN_W, PANEL.MAX_W);
      if (eg.includes("right"))  w = clamp(startW + (ev.clientX - startX), PANEL.MIN_W, PANEL.MAX_W);
      if (eg.includes("top"))    h = clamp(startH - (ev.clientY - startY), PANEL.MIN_H, PANEL.MAX_H);
      if (eg.includes("bottom")) h = clamp(startH + (ev.clientY - startY), PANEL.MIN_H, PANEL.MAX_H);

      setPanelW(w);
      setPanelH(h);
    }

    function onUp() {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [panelW, panelH]);

  // ── Send message ───────────────────────────────────────────────

  async function send(questionOverride) {
    const q = (questionOverride ?? input).trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatWithAI({
        question:    q,
        reviewText:  reviewText ?? "",
        aspectData:  aspectData ?? null,
        insightData: insightData ?? null,
      });
      setMessages((prev) => [...prev, { role: "ai", text: res.answer ?? "ไม่ได้รับข้อมูล" }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: `❌ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([{ role: "ai", text: "เคลียร์แล้วครับ ถามใหม่ได้เลย 😊" }]);
  }

  function togglePanel() {
    setOpen((v) => !v);
    setShowPopup(false);
  }

  const isFirstMessage = messages.length === 1;

  // ── Resize handle styles ────────────────────────────────────────
  const rBase  = { position: "absolute", zIndex: 10 };
  const corner = { ...rBase, width: 14, height: 14 };
  const edgeH  = { ...rBase, height: 6, left: 14, right: 14 };
  const edgeV  = { ...rBase, width: 6, top: 14, bottom: 14 };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <>
      {/* ── Popup tooltip ─────────────────────────────────────── */}
      {showPopup && !open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 1001,
          background: "#1a1a2e", color: "#fff",
          borderRadius: 12, padding: "10px 14px", fontSize: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          maxWidth: 200, lineHeight: 1.5,
          animation: "fadeInUp 0.3s ease",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>💬 AI Chat พร้อมใช้งาน</div>
          <div style={{ opacity: 0.8, fontSize: 11 }}>กดปุ่มนี้เพื่อถาม AI เกี่ยวกับรีวิว</div>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -6, right: 22,
            width: 12, height: 12,
            background: "#1a1a2e", transform: "rotate(45deg)", borderRadius: 2,
          }} />
        </div>
      )}

      {/* ── FAB ───────────────────────────────────────────────── */}
      <button
        onClick={togglePanel}
        title="AI Chat"
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 54, height: 54, borderRadius: "50%",
          background: open ? "#1a6ab5" : "#378ADD",
          color: "#fff", border: "none", fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(55,138,221,0.45)",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s, transform 0.15s",
          transform: open ? "scale(1.08)" : "scale(1)",
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* ── Chat panel ────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24,
          width: panelW, height: panelH,
          background: "#fff", borderRadius: 20,
          border: "1px solid #e8eaf0",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
          overflow: "hidden", zIndex: 999,
          display: "flex", flexDirection: "column",
          animation: "chatSlide 0.2s ease",
          userSelect: resizingRef.current ? "none" : "auto",
        }}>
          <style>{`
            @keyframes chatSlide  { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:none} }
            @keyframes dot        { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
            @keyframes fadeInUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
          `}</style>

          {/* ── Resize handles ─── */}
          <div onMouseDown={(e) => onResizeStart(e, "top")}          style={{ ...edgeH, top: 0,    cursor: "n-resize" }} />
          <div onMouseDown={(e) => onResizeStart(e, "bottom")}       style={{ ...edgeH, bottom: 0, cursor: "s-resize" }} />
          <div onMouseDown={(e) => onResizeStart(e, "left")}         style={{ ...edgeV, left: 0,   cursor: "w-resize" }} />
          <div onMouseDown={(e) => onResizeStart(e, "right")}        style={{ ...edgeV, right: 0,  cursor: "e-resize" }} />
          <div onMouseDown={(e) => onResizeStart(e, "top-left")}     style={{ ...corner, top: 0,    left: 0,  cursor: "nw-resize" }} />
          <div onMouseDown={(e) => onResizeStart(e, "top-right")}    style={{ ...corner, top: 0,    right: 0, cursor: "ne-resize" }} />
          <div onMouseDown={(e) => onResizeStart(e, "bottom-left")}  style={{ ...corner, bottom: 0, left: 0,  cursor: "sw-resize" }} />
          {/* bottom-right มี visual indicator */}
          <div
            onMouseDown={(e) => onResizeStart(e, "bottom-right")}
            style={{ ...corner, bottom: 0, right: 0, cursor: "se-resize", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 3 }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.3 }}>
              <line x1="10" y1="0" x2="0" y2="10" stroke="#888" strokeWidth="1.2" />
              <line x1="10" y1="4" x2="4" y2="10" stroke="#888" strokeWidth="1.2" />
              <line x1="10" y1="8" x2="8" y2="10" stroke="#888" strokeWidth="1.2" />
            </svg>
          </div>

          {/* ── Header ─── */}
          <div style={{
            background: "linear-gradient(135deg,#378ADD,#2573c2)",
            padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>AI Assistant</div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 11 }}>
                {hasContext ? "✓ ใช้ข้อมูลรีวิวที่วิเคราะห์แล้ว" : "ยังไม่มีข้อมูลรีวิว"}
              </div>
            </div>
            <button
              onClick={clearChat}
              style={{
                background: "rgba(255,255,255,0.18)", border: "none",
                borderRadius: 8, color: "#fff", fontSize: 11,
                padding: "5px 10px", cursor: "pointer", fontWeight: 500,
              }}
            >เคลียร์</button>
          </div>

          {/* ── Context badge ─── */}
          {hasContext && (
            <div style={{
              background: "#EBF4FF", borderBottom: "1px solid #DBEAFE",
              padding: "6px 14px", fontSize: 11, color: "#1E40AF",
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            }}>
              <span>📎</span>
              ข้อมูลจากการวิเคราะห์ถูกแนบอัตโนมัติแล้ว
              {aspectData && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({aspectData.map((a) => `${a.name} ${a.score}%`).join(", ")})
                </span>
              )}
            </div>
          )}

          {/* ── Messages ─── */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end", gap: 8,
                }}
              >
                {/* AI avatar */}
                {m.role === "ai" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#EBF4FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, flexShrink: 0,
                  }}>🤖</div>
                )}

                {/* Bubble */}
                <div style={{
                  background: m.role === "user"
                    ? "linear-gradient(135deg,#378ADD,#2573c2)"
                    : "#f5f6fa",
                  color:    m.role === "user" ? "#fff" : "#1a1a2e",
                  padding:  "10px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize: 13, maxWidth: "80%", lineHeight: 1.65,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  boxShadow: m.role === "user"
                    ? "0 2px 8px rgba(55,138,221,0.25)"
                    : "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#EBF4FF",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>🤖</div>
                <div style={{
                  background: "#f5f6fa", borderRadius: "16px 16px 16px 4px",
                  padding: "12px 16px", display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#378ADD",
                      animation: `dot 1.2s ease-in-out ${d}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick questions (แสดงเฉพาะ message แรก) ─── */}
          {isFirstMessage && (
            <div style={{
              padding: "8px 14px", borderTop: "1px solid #f0f0f5",
              display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0,
            }}>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  style={{
                    fontSize: 11, padding: "5px 12px",
                    border: "1px solid #378ADD", borderRadius: 20,
                    background: "transparent", color: "#378ADD",
                    cursor: "pointer", transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => { e.target.style.background = "#EBF4FF"; }}
                  onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input row ─── */}
          <div style={{
            display: "flex", gap: 8, padding: "10px 14px 14px",
            borderTop: "1px solid #eee", alignItems: "flex-end", flexShrink: 0,
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              placeholder="ถามเกี่ยวกับรีวิว... (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={1}
              style={{
                flex: 1, fontSize: 13, padding: "9px 12px",
                border: "1px solid #dde1f0", borderRadius: 12,
                background: "#f9fafc", color: "#1a1a2e",
                outline: "none", resize: "none",
                lineHeight: 1.5, fontFamily: "inherit",
                overflowY: "hidden", transition: "border 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#378ADD"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#dde1f0"; }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: loading || !input.trim() ? "#ddd" : "#378ADD",
                border: "none", color: "#fff", fontSize: 18,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}