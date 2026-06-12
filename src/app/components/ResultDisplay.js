/**
 * ResultDisplay.js — แสดงผลการวิเคราะห์ทั้ง 3 modes
 * ══════════════════════════════════════════════════════════════════
 *
 * Export default: ResultDisplay({ result, mode })
 *   mode "minimum" → <MinimumResult>
 *   mode "medium"  → <MediumResult>
 *   mode "max"     → <MaxResult>
 *
 * ไม่มี hardcoded string รีวิว — ทุกอย่างมาจาก matched_pos/matched_neg
 * ที่ Python backend ส่งมา
 */

"use client";

import React from "react";

// ══════════════════════════════════════════════════════════════════
// ASPECT META  (icon, color, description สำหรับแต่ละ aspect)
// ══════════════════════════════════════════════════════════════════

const ASPECT_META = {
  อาหาร: {
    color: "#F59E0B", light: "#FEF3C7",
    description: "วัดความพึงพอใจด้านรสชาติ คุณภาพ และความสดใหม่ของอาหาร",
    good: "รสชาติถูกปาก วัตถุดิบสด เมนูหลากหลาย",
    bad:  "รสชาติไม่สม่ำเสมอ วัตถุดิบไม่สด ปรุงรสผิด",
    icon: (c) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  ราคา: {
    color: "#10B981", light: "#D1FAE5",
    description: "วัดความรู้สึกคุ้มค่าเมื่อเทียบราคากับคุณภาพที่ได้รับ",
    good: "ราคาสมเหตุสมผล คุ้มค่า มีโปรโมชัน",
    bad:  "ราคาสูงเกิน ไม่คุ้มกับสิ่งที่ได้รับ",
    icon: (c) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15" />
      </svg>
    ),
  },
  บริการ: {
    color: "#6366F1", light: "#EDE9FE",
    description: "วัดความรวดเร็ว ความใส่ใจ และมารยาทของพนักงานบริการ",
    good: "พนักงานยิ้มแย้ม รวดเร็ว ใส่ใจลูกค้า",
    bad:  "บริการช้า พนักงานไม่สนใจ ไม่มีมารยาท",
    icon: (c) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  บรรยากาศ: {
    color: "#EC4899", light: "#FCE7F3",
    description: "วัดความสวยงาม ความสะอาด และความน่าอยู่ของร้าน",
    good: "บรรยากาศสวยงาม สะอาด น่านั่ง เงียบสงบ",
    bad:  "สกปรก เสียงดัง แออัด บรรยากาศไม่ดี",
    icon: (c) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
};


// ══════════════════════════════════════════════════════════════════
// ICON LIBRARY  (inline SVG — ไม่ต้อง install lucide/heroicons)
// ══════════════════════════════════════════════════════════════════

const Icon = {
  ThumbUp: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  ),
  ThumbDown: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
    </svg>
  ),
  Check: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Shield: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Bar: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  ),
  Lens: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Cpu: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9"  y1="1"  x2="9"  y2="4" />  <line x1="15" y1="1"  x2="15" y2="4" />
      <line x1="9"  y1="20" x2="9"  y2="23" /> <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9"  x2="23" y2="9" />  <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1"  y1="9"  x2="4"  y2="9" />  <line x1="1"  y1="14" x2="4"  y2="14" />
    </svg>
  ),
  Bulb: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
    </svg>
  ),
  TrendUp: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Warn: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9"  x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Msg: ({ s = 16, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  ChevronRight: ({ s = 12, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};


// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

/** คืน label + color ตาม score */
function scoreLabel(s) {
  if (s >= 80) return { text: "ดีเยี่ยม",     color: "#065F46", bg: "#D1FAE5" };
  if (s >= 65) return { text: "ดี",           color: "#1E40AF", bg: "#DBEAFE" };
  if (s >= 45) return { text: "พอใช้",        color: "#92400E", bg: "#FEF3C7" };
  return         { text: "ต้องปรับปรุง",  color: "#991B1B", bg: "#FEE2E2" };
}

/** gradient สำหรับ progress bar ตาม score */
function barGrad(s) {
  if (s >= 75) return "linear-gradient(90deg,#10B981,#34D399)";
  if (s >= 50) return "linear-gradient(90deg,#378ADD,#60A5FA)";
  if (s >= 35) return "linear-gradient(90deg,#F59E0B,#FCD34D)";
  return "linear-gradient(90deg,#E24B4A,#F87171)";
}


// ══════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════

/** Section header มี icon + title + optional badge */
function SectionHeader({ icon, title, badge, badgeBg, badgeColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", margin: 0, flex: 1 }}>{title}</h3>
      {badge && (
        <span style={{
          fontSize: 11, padding: "2px 9px", borderRadius: 20,
          background: badgeBg, color: badgeColor,
          fontWeight: 500, whiteSpace: "nowrap",
        }}>{badge}</span>
      )}
    </div>
  );
}

/** Metric tile — ใช้ใน MinimumResult */
function MetricTile({ icon, label, value, bg, color }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color, opacity: 0.7, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

/**
 * CommentBox — แสดง matched sentences จาก backend
 * type: "good" | "bad"
 * items: string[]  (matched_pos หรือ matched_neg)
 */
function CommentBox({ type, title, items = [] }) {
  const isGood = type === "good";
  const cfg = isGood
    ? { bg: "#F0FDF4", border: "#6EE7B7", tc: "#065F46", ac: "#10B981" }
    : { bg: "#FFF5F5", border: "#FCA5A5", tc: "#991B1B", ac: "#E24B4A" };

  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
        {isGood
          ? <Icon.ThumbUp  c={cfg.tc} s={12} />
          : <Icon.ThumbDown c={cfg.tc} s={12} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.tc }}>{title}</span>
      </div>

      {items.length > 0
        ? items.map((text, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 4 }}>
              <span style={{ marginTop: 1, flexShrink: 0 }}>
                <Icon.ChevronRight c={cfg.ac} s={11} />
              </span>
              <span style={{ fontSize: 11, color: cfg.tc, lineHeight: 1.5 }}>{text}</span>
            </div>
          ))
        : <span style={{ fontSize: 11, color: "#bbb" }}>
            {isGood ? "ไม่พบเม้นเชิงบวกจากรีวิวจริง" : "ไม่พบเม้นเชิงลบจากรีวิวจริง"}
          </span>
      }
    </div>
  );
}

/** Progress bar พร้อม threshold marker ที่ 70% */
function ScoreBar({ score }) {
  return (
    <>
      <div style={{
        position: "relative", height: 10,
        background: "#f0f0f5", borderRadius: 20,
        overflow: "visible", marginBottom: 4,
      }}>
        <div style={{ height: "100%", width: `${score}%`, background: barGrad(score), borderRadius: 20 }} />
        {/* Threshold marker 70% */}
        <div style={{
          position: "absolute", top: -3, left: "70%",
          width: 2, height: 16, background: "#94A3B8", borderRadius: 2,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb", marginBottom: 10 }}>
        <span>0%</span>
        <span style={{ color: "#94A3B8" }}>เกณฑ์ผ่าน 70%</span>
        <span>100%</span>
      </div>
    </>
  );
}

/** Insight row — ใช้ใน Medium และ Max */
function InsightRow({ ins }) {
  const isObj = typeof ins === "object";
  const type  = isObj ? ins.type : "neutral";
  const msg   = isObj ? ins.message : ins;

  const cfgs = {
    positive: { bg: "#D1FAE5", color: "#065F46", icon: <Icon.Check    c="#065F46" s={13} /> },
    negative: { bg: "#FEE2E2", color: "#991B1B", icon: <Icon.Warn     c="#991B1B" s={13} /> },
    neutral:  { bg: "#f5f6fa", color: "#555",    icon: <Icon.ChevronRight c="#555" s={13} /> },
  };
  const cfg = cfgs[type] ?? cfgs.neutral;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      background: cfg.bg, borderRadius: 10, padding: "9px 12px",
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <span style={{ fontSize: 12, color: cfg.color, lineHeight: 1.5 }}>{msg}</span>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// MINIMUM RESULT
// ══════════════════════════════════════════════════════════════════

function MinimumResult({ result }) {
  const sr    = result?.result ?? {};
  const isPos = String(sr.sentiment ?? "").toLowerCase().includes("pos");
  const pct   = sr.Reliability ? Math.round(sr.Reliability * 100) : 0;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <SectionHeader
        icon={<Icon.Bar c="#378ADD" s={18} />}
        title="Minimum — ภาพรวม Sentiment"
        badge="free" badgeBg="#D1FAE5" badgeColor="#065F46"
      />

      {/* Metric tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        <MetricTile
          icon={isPos ? <Icon.ThumbUp c="#065F46" s={20} /> : <Icon.ThumbDown c="#991B1B" s={20} />}
          label="Sentiment"
          value={isPos ? "Positive" : "Negative"}
          bg={isPos ? "#D1FAE5" : "#FEE2E2"}
          color={isPos ? "#065F46" : "#991B1B"}
        />
        <MetricTile
          icon={<Icon.Shield c={pct >= 70 ? "#1E40AF" : "#92400E"} s={20} />}
          label="ความน่าเชื่อถือ"
          value={`${pct}%`}
          bg={pct >= 70 ? "#DBEAFE" : "#FEF3C7"}
          color={pct >= 70 ? "#1E40AF" : "#92400E"}
        />
        <MetricTile
          icon={isPos ? <Icon.TrendUp c="#10B981" s={20} /> : <Icon.Warn c="#E24B4A" s={20} />}
          label="Tone"
          value={isPos ? "ชื่นชม" : "ติเตียน"}
          bg="#f5f6fa" color="#1a1a2e"
        />
      </div>

      {/* Confidence bar */}
      <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>
        ความแม่นยำของ AI Model: {pct}%
      </div>
      <div style={{ height: 6, background: "#f0f0f5", borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barGrad(pct), borderRadius: 20 }} />
      </div>

      {/* Keyword tags */}
      {result?.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {result.tags.map((t, i) => (
            <span key={i} style={{
              fontSize: 12, padding: "3px 10px", borderRadius: 20,
              background: t.type === "pos" ? "#D1FAE5" : "#FEE2E2",
              color:      t.type === "pos" ? "#065F46" : "#991B1B",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {t.type === "pos"
                ? <Icon.Check c="#065F46" s={11} />
                : <Icon.Warn  c="#991B1B" s={11} />}
              {t.word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// MEDIUM RESULT
// ══════════════════════════════════════════════════════════════════

function MediumResult({ result }) {
  const aspects  = result?.aspects ?? result?.aspect  ?? [];
  const insights = result?.insights ?? result?.insight ?? [];

  const posInsights  = insights.filter((i) => i?.type === "positive");
  const negInsights  = insights.filter((i) => i?.type === "negative");
  const neutInsights = insights.filter((i) => i?.type === "neutral");
  const strengthItems = posInsights.length > 0 ? posInsights : neutInsights;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <SectionHeader
        icon={<Icon.Lens c="#378ADD" s={18} />}
        title="Medium — วิเคราะห์แต่ละด้าน"
        badge="key required" badgeBg="#FEF3C7" badgeColor="#92400E"
      />

      {/* Aspect cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {aspects.map((a, i) => {
          const meta = ASPECT_META[a.name] ?? {};
          const lbl  = scoreLabel(a.score);

          return (
            <div key={i} style={{
              background: "#fafbff", border: "1px solid #e8eaf0",
              borderRadius: 14, padding: "14px 16px",
            }}>
              {/* Aspect header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: meta.light ?? "#f0f0f5",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {meta.icon?.(meta.color ?? "#378ADD") ?? <Icon.Bar c={meta.color ?? "#378ADD"} s={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{a.name}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 20,
                      background: lbl.bg, color: lbl.color, fontWeight: 600,
                    }}>{lbl.text}</span>
                    <span style={{ marginLeft: "auto", fontSize: 24, fontWeight: 800, color: meta.color ?? "#378ADD" }}>
                      {a.score}%
                    </span>
                  </div>
                  {meta.description && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{meta.description}</div>
                  )}
                </div>
              </div>

              {/* Score bar */}
              <ScoreBar score={a.score} />

              {/* Mention counts */}
              {a.total_mentions > 0 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", borderRadius: 8, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon.Check c="#065F46" s={11} /> {a.pos_count} เชิงบวก
                  </div>
                  <div style={{ fontSize: 11, background: "#FEE2E2", color: "#991B1B", borderRadius: 8, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon.Warn c="#991B1B" s={11} /> {a.neg_count} เชิงลบ
                  </div>
                  <div style={{ fontSize: 11, background: "#f5f6fa", color: "#888", borderRadius: 8, padding: "3px 10px" }}>
                    รวม {a.total_mentions} mentions
                  </div>
                </div>
              )}

              {/* Signal / Risk boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Icon.Check c="#065F46" s={12} />
                    <span style={{ fontSize: 10, color: "#065F46", fontWeight: 700 }}>สัญญาณดี</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#065F46", lineHeight: 1.5 }}>{meta.good ?? ""}</div>
                </div>
                <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Icon.Warn c="#991B1B" s={12} />
                    <span style={{ fontSize: 10, color: "#991B1B", fontWeight: 700 }}>จุดเสี่ยง</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#991B1B", lineHeight: 1.5 }}>{meta.bad ?? ""}</div>
                </div>
              </div>

              {/* Real matched sentences */}
              <div style={{ borderTop: "1px dashed #e8eaf0", paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                  <Icon.Msg c="#bbb" s={11} />
                  <span style={{ fontSize: 10, color: "#bbb", fontWeight: 600 }}>ตัวอย่างเม้นที่พบจากรีวิวจริง</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <CommentBox type="good" title="เม้นดี"  items={a.matched_pos ?? []} />
                  <CommentBox type="bad"  title="เม้นแย่" items={a.matched_neg ?? []} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart comparison */}
      {aspects.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Icon.Bar c="#378ADD" s={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>เปรียบเทียบทุกด้าน</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {aspects.map((a, i) => {
              const meta = ASPECT_META[a.name] ?? {};
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color ?? "#378ADD" }}>{a.score}%</span>
                  <div style={{
                    width: "100%",
                    height: `${Math.max(4, (a.score / 100) * 65)}px`,
                    background: barGrad(a.score),
                    borderRadius: "6px 6px 0 0",
                  }} />
                  <span style={{ fontSize: 10, color: "#888", textAlign: "center" }}>{a.name}</span>
                </div>
              );
            })}
          </div>
          <div style={{ height: 1, background: "#e8eaf0" }} />
        </div>
      )}

      {/* Strengths / Weaknesses */}
      {insights.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Icon.Bulb c="#378ADD" s={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>สรุปจุดเด่น — จุดด้อย</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Strengths */}
            <div style={{ background: "#F0FDF4", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Icon.TrendUp c="#065F46" s={14} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#065F46" }}>จุดเด่น</span>
                <span style={{ marginLeft: "auto", fontSize: 11, background: "#D1FAE5", color: "#065F46", borderRadius: 20, padding: "1px 8px" }}>
                  {strengthItems.length} รายการ
                </span>
              </div>
              {strengthItems.length > 0
                ? strengthItems.map((ins, i) => {
                    const msg = typeof ins === "object" ? ins.message : ins;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
                        <span style={{ marginTop: 1, flexShrink: 0 }}><Icon.Check c="#10B981" s={13} /></span>
                        <span style={{ fontSize: 12, color: "#065F46", lineHeight: 1.55 }}>{msg}</span>
                      </div>
                    );
                  })
                : <span style={{ fontSize: 12, color: "#aaa" }}>ไม่พบจุดเด่นที่ชัดเจน</span>
              }
            </div>

            {/* Weaknesses */}
            <div style={{ background: "#FFF5F5", border: "1px solid #FCA5A5", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Icon.Warn c="#991B1B" s={14} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>จุดด้อย</span>
                <span style={{ marginLeft: "auto", fontSize: 11, background: "#FEE2E2", color: "#991B1B", borderRadius: 20, padding: "1px 8px" }}>
                  {negInsights.length} รายการ
                </span>
              </div>
              {negInsights.length > 0
                ? negInsights.map((ins, i) => {
                    const msg = typeof ins === "object" ? ins.message : ins;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
                        <span style={{ marginTop: 1, flexShrink: 0 }}><Icon.Warn c="#E24B4A" s={13} /></span>
                        <span style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.55 }}>{msg}</span>
                      </div>
                    );
                  })
                : <span style={{ fontSize: 12, color: "#aaa" }}>ไม่พบจุดด้อยที่ชัดเจน</span>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// MAX RESULT
// ══════════════════════════════════════════════════════════════════

/**
 * parseAnalysisText — แปลง AI markdown text → { good[], bad[], improve[] }
 * รองรับ "- KEY: VALUE" และ "SHORT_KEY\nLONG_VALUE" format
 */
function parseAnalysisText(text) {
  if (!text) return null;

  const cleaned = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s*/gm, "");

  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  const pairs = [];
  let idx = 0;

  const isShort = (l) => l && l.length <= 22 && !/[.!?]$/.test(l);
  const isLong  = (l) => l && l.length > 15;

  while (idx < lines.length) {
    const line = lines[idx];

    // Pattern: "- KEY: VALUE"
    const mColon = line.match(/^-\s+([^:：]+)[：:](.*)/);
    if (mColon) {
      const key = mColon[1].trim();
      let val   = mColon[2].trim();
      idx++;
      while (
        idx < lines.length &&
        !lines[idx].match(/^-\s+[^:：]+[：:]/) &&
        !(isShort(lines[idx]) && isLong(lines[idx + 1]))
      ) {
        val += (val ? " " : "") + lines[idx].replace(/^-\s+/, "").trim();
        idx++;
      }
      if (key) pairs.push({ key, val });
      continue;
    }

    // Pattern: "SHORT_LABEL\nLONG_VALUE"
    if (isShort(line) && idx + 1 < lines.length && isLong(lines[idx + 1])) {
      const key    = line.replace(/^-\s+/, "").trim();
      const vParts = [];
      idx++;
      while (
        idx < lines.length &&
        !(isShort(lines[idx]) && idx + 1 < lines.length && isLong(lines[idx + 1])) &&
        !lines[idx].match(/^-\s+[^:：]+[：:]/)
      ) {
        vParts.push(lines[idx].replace(/^-\s+/, "").trim());
        idx++;
      }
      if (key && vParts.length) pairs.push({ key, val: vParts.join(" ") });
      continue;
    }

    idx++;
  }

  if (!pairs.length) return null;

  const BAD_KW = ["บ่น", "แย่", "ด้อย", "ปัญหา", "ไม่พอใจ", "ข้อเสีย"];
  const IMP_KW = ["ปรับปรุง", "แนะนำ", "แก้ไข", "เพิ่ม", "พัฒนา", "จัดการ"];

  const good = [], bad = [], improve = [];
  pairs.forEach(({ key, val }) => {
    if (IMP_KW.some((w) => key.includes(w)))      improve.push(val);
    else if (BAD_KW.some((w) => key.includes(w))) bad.push(val);
    else                                           good.push(val);
  });

  return { good, bad, improve };
}

function MaxResult({ result }) {
  const aspects      = result?.aspects  ?? result?.aspect  ?? [];
  const insights     = result?.insights ?? result?.insight ?? [];
  const analysisText = result?.analysis ?? "";
  const grouped      = parseAnalysisText(analysisText);

  const CARDS = [
    { key: "good",    label: "จุดเด่น",              dot: "#10B981", color: "#064E3B", bg: "#F0FDF4", border: "#A7F3D0", empty: "ไม่พบข้อมูล" },
    { key: "bad",     label: "สิ่งที่ลูกค้าไม่พอใจ", dot: "#EF4444", color: "#7F1D1D", bg: "#FFF5F5", border: "#FECACA", empty: "ไม่พบข้อมูล" },
    { key: "improve", label: "ควรปรับปรุง",           dot: "#3B82F6", color: "#1E3A8A", bg: "#EFF6FF", border: "#BFDBFE", empty: "ไม่มีข้อแนะนำเพิ่มเติม" },
  ];

  return (
    <div className="card">
      <SectionHeader
        icon={<Icon.Cpu c="#378ADD" s={18} />}
        title="Max — AI Deep Analysis"
        badge="key required" badgeBg="#FEF3C7" badgeColor="#92400E"
      />

      {/* Circular score gauges */}
      {aspects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Icon.Bar c="#378ADD" s={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Deep Score — ทุกด้าน</span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(aspects.length, 4)}, 1fr)`,
            gap: 10,
          }}>
            {aspects.map((a, i) => {
              const meta = ASPECT_META[a.name] ?? {};
              const lbl  = scoreLabel(a.score);
              const R = 30, C = 2 * Math.PI * R;
              return (
                <div key={i} style={{
                  background: "#fafbff", border: "1px solid #e8eaf0",
                  borderRadius: 14, padding: "14px 10px", textAlign: "center",
                }}>
                  {/* SVG gauge */}
                  <svg width="80" height="80" style={{ display: "block", margin: "0 auto 6px" }}>
                    <circle cx="40" cy="40" r={R} fill="none" stroke="#f0f0f5" strokeWidth="7" />
                    <circle
                      cx="40" cy="40" r={R} fill="none"
                      stroke={meta.color ?? "#378ADD"} strokeWidth="7"
                      strokeDasharray={`${(a.score / 100) * C} ${C}`}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                    />
                    <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1a1a2e">
                      {a.score}%
                    </text>
                  </svg>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
                    {meta.icon?.(meta.color ?? "#378ADD") ?? <Icon.Bar c={meta.color ?? "#378ADD"} s={16} />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{a.name}</div>
                  <span style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 20,
                    background: lbl.bg, color: lbl.color, fontWeight: 600,
                  }}>{lbl.text}</span>
                  {a.total_mentions > 0 && (
                    <div style={{ marginTop: 6, fontSize: 10, color: "#aaa" }}>
                      +{a.pos_count} / -{a.neg_count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Horizontal bar comparison */}
      {aspects.length > 0 && (
        <div style={{ marginBottom: 20, background: "#fafbff", border: "1px solid #e8eaf0", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 12 }}>เปรียบเทียบเชิงลึก</div>
          {aspects.map((a, i) => {
            const meta = ASPECT_META[a.name] ?? {};
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {meta.icon?.(meta.color ?? "#378ADD") ?? <Icon.Bar c={meta.color ?? "#378ADD"} s={14} />}
                <span style={{ fontSize: 12, width: 70, flexShrink: 0, color: "#555" }}>{a.name}</span>
                <div style={{ flex: 1, height: 12, background: "#f0f0f5", borderRadius: 20, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${a.score}%`, background: barGrad(a.score), borderRadius: 20 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: "right", color: meta.color ?? "#378ADD" }}>
                  {a.score}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* AI analysis cards */}
      {grouped
        ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
            {CARDS.map((card) => {
              const items = grouped[card.key] ?? [];
              return (
                <div key={card.key} style={{
                  background: card.bg, border: `1px solid ${card.border}`,
                  borderRadius: 14, padding: "14px 14px 16px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: card.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: card.color, letterSpacing: "0.03em" }}>
                      {card.label}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: card.color, lineHeight: 1.8,
                    margin: 0, opacity: items.length ? 0.88 : 0.45,
                  }}>
                    {items.join(" ") || card.empty}
                  </p>
                </div>
              );
            })}
          </div>
        )
        : analysisText
          ? (
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", marginBottom: 16, whiteSpace: "pre-wrap" }}>
              {analysisText}
            </div>
          )
          : null
      }

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Icon.Bulb c="#378ADD" s={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Insights สรุป</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {insights.map((ins, i) => <InsightRow key={i} ins={ins} />)}
          </div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ══════════════════════════════════════════════════════════════════

/**
 * ResultDisplay — root component
 *
 * Props:
 *   result — object  backend response
 *   mode   — "minimum" | "medium" | "max"
 */
export default function ResultDisplay({ result, mode }) {
  if (!result) return null;
  if (mode === "minimum") return <MinimumResult result={result} />;
  if (mode === "medium")  return <MediumResult  result={result} />;
  if (mode === "max")     return <MaxResult      result={result} />;
  return null;
}