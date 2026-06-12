/**
 * Loading.js — Spinner แสดงระหว่างวิเคราะห์
 */

"use client";

export default function Loading() {
  return (
    <div style={{
      textAlign: "center", padding: "2rem",
      color: "#7a7060", fontSize: 14,
      fontFamily: "'Sarabun', sans-serif",
    }}>
      <div style={{
        width: 36, height: 36,
        border: "3px solid #e8e4e0",
        borderTop: "3px solid #D08E37",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 12px",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      กำลังวิเคราะห์...
    </div>
  );
}