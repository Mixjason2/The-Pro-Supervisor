/**
 * page.js — Main page สำหรับ The Pro Supervisor
 * ══════════════════════════════════════════════════════════════════
 *
 * Flow:
 *   1. ผู้ใช้เลือก mode (Minimum / Medium / Max)
 *   2. วาง / อัปโหลด review text
 *   3. กด Analyze → เรียก backend พร้อมกันทุก mode ที่จำเป็น
 *   4. แสดงผลสะสม (ไม่ reset เมื่อเปลี่ยน mode)
 *   5. Mode Max → แสดง ChatBox floating
 *
 * State design:
 *   results  — { minimum, medium, max }  เก็บผลแยกต่อ mode
 *   sharedContext — context ส่งต่อให้ ChatBox (aspect + insight)
 */

"use client";

import { useState } from "react";

import ModeSelector  from "./components/ModeSelector";
import ReviewInput   from "./components/ReviewInput";
import FileUpload    from "./components/FileUpload";
import ResultDisplay from "./components/ResultDisplay";
import ChatBox       from "./components/ChatBox";
import Loading       from "./components/Loading";
import { analyzeReview } from "./services/api";

import "./globals.css";

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function Home() {
  // ── Input state ────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [mode, setMode] = useState("minimum");

  // ── Request state ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Result state (เก็บสะสม ไม่ reset เมื่อ mode เปลี่ยน) ────────
  const [results, setResults] = useState({ minimum: null, medium: null, max: null });

  // ── ChatBox context (aspect + insight จาก medium/max) ───────────
  const [chatCtx, setChatCtx] = useState({
    reviewText:  "",
    aspectData:  null,
    insightData: null,
  });

  // ── Analyze handler ─────────────────────────────────────────────

  async function handleAnalyze() {
    if (!text.trim()) {
      alert("กรุณาใส่รีวิวก่อน");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "minimum") {
        // เรียกแค่ minimum
        const minRes = await analyzeReview(text, "minimum");
        setResults((prev) => ({ ...prev, minimum: minRes }));
        setChatCtx((prev) => ({ ...prev, reviewText: text }));

      } else if (mode === "medium") {
        // เรียก minimum + medium พร้อมกัน
        const [minRes, medRes] = await Promise.all([
          analyzeReview(text, "minimum").catch(() => null),
          analyzeReview(text, "medium"),
        ]);
        setResults((prev) => ({
          ...prev,
          minimum: minRes ?? prev.minimum,
          medium:  medRes,
        }));
        setChatCtx({
          reviewText:  text,
          aspectData:  medRes?.aspect  ?? null,
          insightData: medRes?.insight ?? null,
        });

      } else if (mode === "max") {
        // เรียก minimum + medium + max พร้อมกัน
        const [minRes, medRes, maxRes] = await Promise.all([
          analyzeReview(text, "minimum").catch(() => null),
          analyzeReview(text, "medium").catch(() => null),
          analyzeReview(text, "max"),
        ]);
        setResults({
          minimum: minRes ?? results.minimum,
          medium:  medRes ?? results.medium,
          max:     maxRes,
        });
        // ใช้ aspect จาก medium ก่อน ถ้าไม่มีใช้จาก max
        const aspectSrc = medRes ?? maxRes;
        setChatCtx({
          reviewText:  text,
          aspectData:  aspectSrc?.aspect  ?? null,
          insightData: aspectSrc?.insight ?? null,
        });
      }

    } catch (err) {
      setError(err.message ?? "เกิดข้อผิดพลาด กรุณาตรวจสอบ backend");
    } finally {
      setLoading(false);
    }
  }

  // ── Visibility logic ────────────────────────────────────────────
  // แสดงผลสะสม: mode medium แสดง minimum+medium, mode max แสดงทั้ง 3
  const showMin = ["minimum", "medium", "max"].includes(mode) && !!results.minimum;
  const showMed = ["medium", "max"].includes(mode)            && !!results.medium;
  const showMax = mode === "max"                              && !!results.max;
  const hasAny  = showMin || showMed || showMax;

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="container" style={{ fontFamily: "'Sarabun', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{
          fontSize: 26, fontWeight: 700, marginBottom: 4,
          color: "#252832",
          fontFamily: "'Prompt', 'Sarabun', sans-serif",
          letterSpacing: "-0.3px",
        }}>
          The Pro Supervisor
        </h1>
        <p style={{ color: "#8a7f72", fontSize: 14 }}>
          Minimum · Medium · Max — AI-powered review analysis
        </p>
      </div>

      {/* ── Mode selector ──────────────────────────────────────── */}
      <ModeSelector mode={mode} setMode={setMode} />

      {/* ── Input card ─────────────────────────────────────────── */}
      <div className="card">
        <ReviewInput text={text} setText={setText} />
        <FileUpload  setText={setText} />

        {/* Analyze button */}
        <button
          className="btn-full"
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            fontFamily: "'Sarabun', sans-serif",
          }}
        >
          {loading
            ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTop: "2px solid #fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                กำลังวิเคราะห์...
              </>
            )
            : "Analyze Review"
          }
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>

      {/* ── Error banner ───────────────────────────────────────── */}
      {error && (
        <div style={{
          background: "#fdf0ee", border: "1px solid #d9a09a",
          borderRadius: 12, padding: "12px 16px",
          fontSize: 13, color: "#7a2f25", marginBottom: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {/* ── Loading spinner ─────────────────────────────────────── */}
      {loading && <Loading />}

      {/* ── Results ─────────────────────────────────────────────── */}
      {!loading && hasAny && (
        <div>
          {showMin && <ResultDisplay result={results.minimum} mode="minimum" />}
          {showMed && <ResultDisplay result={results.medium}  mode="medium"  />}
          {showMax && <ResultDisplay result={results.max}     mode="max"     />}
        </div>
      )}

      {/* ── ChatBox (Max mode only) ─────────────────────────────── */}
      {mode === "max" && (
        <ChatBox
          reviewText={chatCtx.reviewText}
          aspectData={chatCtx.aspectData}
          insightData={chatCtx.insightData}
        />
      )}

    </div>
  );
}