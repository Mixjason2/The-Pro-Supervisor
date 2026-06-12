/**
 * ReviewInput.js — Textarea สำหรับวาง / พิมพ์ review text
 * ══════════════════════════════════════════════════════════
 *
 * Props:
 *   text    — string  current value
 *   setText — fn(string)
 */

"use client";

export default function ReviewInput({ text, setText }) {
  return (
    <textarea
      className="input"
      rows={5}
      placeholder="วางรีวิวที่นี่... หรืออัปโหลดไฟล์ด้านล่าง"
      value={text}
      onChange={(e) => setText(e.target.value)}
      style={{
        resize: "vertical",
        lineHeight: 1.6,
        fontFamily: "'Sarabun', sans-serif",
      }}
    />
  );
}