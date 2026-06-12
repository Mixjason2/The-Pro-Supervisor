/**
 * FileUpload.js — อัปโหลดไฟล์รีวิว (.txt / .csv / .xlsx / .xls)
 * ══════════════════════════════════════════════════════════════════
 *
 * ปัญหาเดิมที่แก้แล้ว:
 *   ✓ csvToText เดิม join ทุก column → ชื่อคนหลุดมาในรีวิว
 *   ✓ ตอนนี้ parse CSV จริงๆ แล้ว extract เฉพาะ column "text"
 *
 * CSV Strategy (priority order):
 *   1. มี header row → หา column ชื่อ "text" / "review" / "content"
 *   2. ไม่มี header / หาไม่เจอ → ใช้ column ที่ยาวเฉลี่ยมากสุด
 *      (Google Maps CSV: สุดท้ายคือ review text เสมอ)
 *
 * Props:
 *   setText(str) — callback รับ review text ที่ join ด้วย "\\n"
 */

"use client";

import { useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────
const FILE_ICONS = { txt: "📄", csv: "📊", xlsx: "📗", xls: "📗" };

// column names ที่ถือว่าเป็น "review text"
const REVIEW_COL_NAMES = new Set([
  "text", "review", "content", "comment",
  "รีวิว", "เนื้อหา", "ความคิดเห็น",
]);

// ── XLSX CDN ──────────────────────────────────────────────────────
const XLSX_CDN = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";


// ══════════════════════════════════════════════════════════════════
// CSV PARSER
// ══════════════════════════════════════════════════════════════════

/**
 * parseCSVRaw — แปลง CSV string → 2D array (rows of cells)
 * รองรับ: quoted fields, escaped quotes (""), newline ใน quotes
 *
 * @param {string} raw
 * @returns {string[][]}
 */
function parseCSVRaw(raw) {
  const rows  = [];
  let   cur   = "";
  let   inQ   = false;

  for (let i = 0; i < raw.length; i++) {
    const ch   = raw[i];
    const next = raw[i + 1];

    if (ch === '"') {
      if (inQ && next === '"') { cur += '"'; i++; }  // escaped ""
      else                      inQ = !inQ;
    } else if (ch === "," && !inQ) {
      if (!rows.length) rows.push([]);
      rows[rows.length - 1].push(cur.trim());
      cur = "";
    } else if ((ch === "\n" || (ch === "\r" && next === "\n")) && !inQ) {
      if (ch === "\r") i++;                            // skip \n of \r\n
      if (!rows.length) rows.push([]);
      rows[rows.length - 1].push(cur.trim());
      cur = "";
      rows.push([]);
    } else {
      cur += ch;
    }
  }

  // flush last field
  if (cur.trim() || rows.length) {
    if (!rows.length) rows.push([]);
    rows[rows.length - 1].push(cur.trim());
  }

  // remove empty trailing rows
  while (rows.length && rows[rows.length - 1].every((c) => !c)) {
    rows.pop();
  }

  return rows;
}

/**
 * detectTextColIdx — หา index ของ column ที่เป็น review text
 *
 * @param {string[][]} rows   - 2D array from parseCSVRaw
 * @param {string[]} headers  - header row (lowercase) หรือ [] ถ้าไม่มี
 * @param {string[][]} data   - data rows (ไม่รวม header)
 * @returns {number}
 */
function detectTextColIdx(rows, headers, data) {
  // 1. หา column ตาม header name
  if (headers.length) {
    const idx = headers.findIndex((h) => REVIEW_COL_NAMES.has(h.toLowerCase().trim()));
    if (idx !== -1) return idx;
  }

  // 2. fallback: column ที่มีความยาวเฉลี่ยมากที่สุด
  //    (ปกติ review text จะยาวกว่า title/url/name มาก)
  const colCount = Math.max(...(data.length ? data.map((r) => r.length) : [[rows[0]?.length ?? 1]]));
  const avgLen   = Array.from({ length: colCount }, (_, ci) =>
    data.reduce((sum, r) => sum + (r[ci]?.length ?? 0), 0) / (data.length || 1),
  );
  return avgLen.indexOf(Math.max(...avgLen));
}

/**
 * looksLikeHeader — ตรวจว่า row แรกน่าจะเป็น header
 * เงื่อนไข: ทุก cell ไม่มีภาษาไทย และไม่ใช่ URL
 *
 * @param {string[]} row
 * @returns {boolean}
 */
function looksLikeHeader(row) {
  return (
    row.length > 1 &&
    row.every(
      (c) => !/[\u0e00-\u0e7f]/.test(c) && !/^https?:\/\//.test(c),
    )
  );
}

/**
 * csvToReviews — แปลง CSV string → array ของ review text
 *
 * @param {string} raw
 * @returns {string[]}
 */
function csvToReviews(raw) {
  const rows = parseCSVRaw(raw);
  if (!rows.length) return [];

  const hasHeader = looksLikeHeader(rows[0]);
  const headers   = hasHeader ? rows[0] : [];
  const dataRows  = hasHeader ? rows.slice(1) : rows;

  const colIdx = detectTextColIdx(rows, headers, dataRows);

  return dataRows
    .map((row) => (row[colIdx] ?? "").trim())
    .filter((t) => t.length > 3);  // กรอง cell ว่าง / สั้นเกิน
}


// ══════════════════════════════════════════════════════════════════
// XLSX PARSER
// ══════════════════════════════════════════════════════════════════

/**
 * loadXLSXLib — โหลด SheetJS จาก CDN (ครั้งเดียว)
 * @returns {Promise<void>}
 */
async function loadXLSXLib() {
  if (window.XLSX) return;
  await new Promise((res, rej) => {
    const s    = document.createElement("script");
    s.src      = XLSX_CDN;
    s.onload   = res;
    s.onerror  = () => rej(new Error("โหลด SheetJS ไม่สำเร็จ"));
    document.head.appendChild(s);
  });
}

/**
 * xlsxToReviews — แปลง Excel file → array ของ review text
 * ใช้ logic เดียวกับ csvToReviews (detect column อัตโนมัติ)
 *
 * @param {File} file
 * @returns {Promise<string[]>}
 */
async function xlsxToReviews(file) {
  await loadXLSXLib();
  const XLSX = window.XLSX;

  const buf      = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buf), { type: "array" });
  const reviews  = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet   = workbook.Sheets[sheetName];
    const rows    = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rows.length) continue;

    // แปลง cell เป็น string แล้ว trim
    const strRows  = rows.map((r) => r.map((c) => String(c).trim()));
    const hasHeader = looksLikeHeader(strRows[0]);
    const headers   = hasHeader ? strRows[0] : [];
    const dataRows  = hasHeader ? strRows.slice(1) : strRows;

    const colIdx = detectTextColIdx(strRows, headers, dataRows);

    const sheetReviews = dataRows
      .map((row) => (row[colIdx] ?? "").trim())
      .filter((t) => t.length > 3);

    reviews.push(...sheetReviews);
  }

  return reviews;
}


// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function FileUpload({ setText }) {
  const inputRef    = useRef(null);
  const [status,    setStatus]    = useState(null);   // null | "loading" | "done" | "error"
  const [fileName,  setFileName]  = useState("");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [revCount,  setRevCount]  = useState(0);

  const getExt = (name) => name.split(".").pop().toLowerCase();

  // ── File handler ───────────────────────────────────────────────
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const ext = getExt(file.name);
    setFileName(file.name);
    setStatus("loading");
    setErrorMsg("");
    setRevCount(0);

    try {
      let reviews = [];

      if (ext === "txt") {
        // txt: ส่งทั้งไฟล์เป็น single review
        const raw = await file.text();
        reviews   = raw.trim() ? [raw.trim()] : [];

      } else if (ext === "csv") {
        const raw = await file.text();
        reviews   = csvToReviews(raw);

      } else if (ext === "xlsx" || ext === "xls") {
        reviews = await xlsxToReviews(file);

      } else {
        throw new Error(`ไม่รองรับไฟล์ .${ext}`);
      }

      if (!reviews.length) throw new Error("ไม่พบรีวิวในไฟล์");

      // join ด้วย newline แล้วส่งไป parent
      setText(reviews.join("\n"));
      setRevCount(reviews.length);
      setStatus("done");

    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "อ่านไฟล์ไม่ได้");
    } finally {
      // reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
      e.target.value = "";
    }
  }

  // ── Style helpers ──────────────────────────────────────────────
  const ext         = fileName ? getExt(fileName) : null;
  const icon        = ext ? (FILE_ICONS[ext] ?? "📄") : null;
  const borderColor = status === "done" ? "#3B9643" : status === "error" ? "#AA4A39" : "#d9d4ce";
  const bgColor     = status === "done" ? "#f0f9f1" : status === "error" ? "#fdf3f1" : "transparent";
  const textColor   = status === "done" ? "#2a6b30" : "#8a7f72";

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 10 }}>

      {/* Upload label / button */}
      <label
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, color: textColor,
          border: `1px dashed ${borderColor}`,
          background: bgColor,
          padding: "6px 14px", borderRadius: 8,
          cursor: "pointer", transition: "all 0.15s",
          fontFamily: "'Sarabun', sans-serif",
        }}
      >
        {/* Loading */}
        {status === "loading" && (
          <>
            <span style={{
              width: 12, height: 12, borderRadius: "50%",
              border: "2px solid #e8e4e0", borderTop: "2px solid #D08E37",
              display: "inline-block", animation: "spin 0.7s linear infinite",
            }} />
            กำลังอ่านไฟล์...
          </>
        )}

        {/* Success */}
        {status === "done" && (
          <>
            {icon} {fileName} ✓ โหลดแล้ว&nbsp;
            {revCount > 0 && (
              <span style={{
                background: "#D1FAE5", color: "#065F46",
                borderRadius: 20, padding: "1px 8px",
                fontSize: 11, fontWeight: 600,
              }}>
                {revCount} รีวิว
              </span>
            )}
          </>
        )}

        {/* Error */}
        {status === "error" && <>⚠️ ลองอีกครั้ง</>}

        {/* Default */}
        {!status && <>+ อัปโหลดไฟล์ (.txt / .csv / .xlsx)</>}

        <input
          ref={inputRef}
          type="file"
          accept=".txt,.csv,.xlsx,.xls"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </label>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <div style={{ marginTop: 5, fontSize: 11, color: "#AA4A39", fontFamily: "'Sarabun', sans-serif" }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* Helper text */}
      {!status && (
        <div style={{ marginTop: 4, fontSize: 11, color: "#b5a999", fontFamily: "'Sarabun', sans-serif" }}>
          รองรับ: .txt · .csv · .xlsx · .xls — ดึงเฉพาะ column &quot;text&quot; อัตโนมัติ
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}