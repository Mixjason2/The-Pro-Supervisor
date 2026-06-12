/**
 * api.js — Frontend service layer สำหรับ The Pro Supervisor
 * ══════════════════════════════════════════════════════════
 *
 * Public API
 * ──────────
 *   analyzeReview(text, mode)                          → Promise<object>
 *   chatWithAI({ question, reviewText, aspectData, insightData }) → Promise<{ answer: string }>
 *
 * Features:
 *   - Configurable timeout (30s default)
 *   - ชัดเจนใน error message (timeout vs server error vs network)
 *   - Request/response logging ใน development
 */

// ── Config ────────────────────────────────────────────────────────
const API_URL     = "http://192.168.1.58:8000 , http://172.20.10.10:3000" ;
const TIMEOUT_MS  = 30_000;  // 30 seconds
const IS_DEV      = process.env.NODE_ENV !== "production";


// ══════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * log — log เฉพาะใน development เพื่อไม่รก production console
 */
function log(label, data) {
  if (IS_DEV) console.log(`[API] ${label}`, data);
}

/**
 * fetchWithTimeout — fetch + AbortController timeout
 *
 * Throws descriptive Error:
 *   "Request timeout (30s)"          — AbortError
 *   "Server error 500: ..."          — HTTP ≥ 400
 *   "Network error: ..."             — DNS / CORS / offline
 */
async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      // พยายาม parse error body ให้ได้ข้อความที่ชัดเจน
      let detail = res.statusText;
      try {
        const errJson = await res.json();
        detail = errJson.detail ?? errJson.error ?? detail;
      } catch {
        // ถ้า parse ไม่ได้ก็ใช้ statusText
      }
      throw new Error(`Server error ${res.status}: ${detail}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      throw new Error(`Request timeout (${timeoutMs / 1000}s) — server ไม่ตอบสนอง`);
    }
    // rethrow ด้วย message เดิม (network error หรือ server error)
    throw err;
  }
}


// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

/**
 * analyzeReview — POST /analyze
 *
 * @param {string} text  - review text (raw)
 * @param {string} mode  - "minimum" | "medium" | "max"
 * @returns {Promise<object>} backend response
 */
export async function analyzeReview(text, mode) {
  log("POST /analyze", { mode, chars: text.length });

  const data = await fetchWithTimeout(
    `${API_URL}/analyze`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ text, mode }),
    },
  );

  log("/analyze ✓", { mode, keys: Object.keys(data) });
  return data;
}


/**
 * chatWithAI — POST /chat
 *
 * @param {{ question: string, reviewText?: string, aspectData?: object[]|null, insightData?: object[]|null }} params
 * @returns {Promise<{ answer: string }>}
 */
export async function chatWithAI({ question, reviewText = "", aspectData = null, insightData = null }) {
  log("POST /chat", { chars: question.length, hasAspect: !!aspectData });

  const data = await fetchWithTimeout(
    `${API_URL}/chat`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        review_text:  reviewText,
        aspect_data:  aspectData,
        insight_data: insightData,
      }),
    },
    20_000,   // chat timeout สั้นกว่า analyze เพราะ user รอ realtime
  );

  log("/chat ✓", { answerChars: data.answer?.length });
  return data;
}