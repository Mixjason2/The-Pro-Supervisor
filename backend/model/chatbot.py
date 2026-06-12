"""
chatbot.py — AI analysis & chatbot via OpenRouter (Qwen 2.5-72B)
══════════════════════════════════════════════════════════════════

Public API
──────────
  analyze_with_ai(text, aspect_data?, insight_data?) → str
  chat_with_ai(question, review_text?, aspect_data?, insight_data?) → str

Design decisions:
  - ใช้ aspect_data/insight_data เป็น context summary แทนการส่ง review ยาวๆ
    → ลด token ใช้ และลด latency
  - lru_cache(maxsize=1) สำหรับ OpenAI client (singleton)
  - Text truncation ก่อนส่ง API เสมอ
  - Exception ทุก kind ถูก catch และคืน error string (ไม่ crash server)
"""

from __future__ import annotations

from functools import lru_cache

# ── Limits ────────────────────────────────────────────────────────
_MAX_REVIEW_CHARS  = 800   # ตัด review ก่อนส่ง AI
_MAX_CHAT_CHARS    = 600   # ตัด user question ก่อนส่ง AI
_MAX_REVIEW_CTX    = 400   # review context ใน chat endpoint

_MODEL        = "qwen/qwen-2.5-72b-instruct"
_API_BASE_URL = "https://openrouter.ai/api/v1"

# ── Replace with env variable in production ──────────────────────
# import os; _API_KEY = os.environ["OPENROUTER_API_KEY"]
_API_KEY = "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"


# ══════════════════════════════════════════════════════════════════
# CLIENT  (singleton via lru_cache)
# ══════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def _client():
    """
    สร้าง OpenAI-compatible client สำหรับ OpenRouter
    ใช้ lru_cache เพื่อให้ init เพียงครั้งเดียว
    """
    from openai import OpenAI  # type: ignore
    c = OpenAI(base_url=_API_BASE_URL, api_key=_API_KEY)
    print("✅ Qwen client initialized")
    return c


# ══════════════════════════════════════════════════════════════════
# INTERNAL HELPERS
# ══════════════════════════════════════════════════════════════════

def _truncate(text: str, limit: int) -> str:
    """ตัด text ไม่ให้เกิน limit chars พร้อมแจ้งว่าถูกตัด"""
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[:limit] + f"\n...(ตัดบางส่วนออก รวม {len(text)} ตัวอักษร)"


def _build_context(
    aspect_data: list | None,
    insight_data: list | None,
) -> str:
    """
    สร้าง context block จาก aspect + insight data
    ใช้แทนการส่ง review ยาวๆ เพื่อประหยัด token

    Returns:
      "คะแนนแต่ละด้าน: อาหาร 85%, ราคา 70%, ...\nสรุปผล: ..."
      หรือ "" ถ้าไม่มีข้อมูล
    """
    parts: list[str] = []

    if aspect_data:
        scores = ", ".join(
            f"{a['name']} {a['score']}%"
            for a in aspect_data
            if isinstance(a, dict) and "name" in a and "score" in a
        )
        if scores:
            parts.append(f"คะแนนแต่ละด้าน: {scores}")

    if insight_data:
        msgs = " | ".join(
            i.get("message", "")
            for i in insight_data
            if isinstance(i, dict) and i.get("message")
        )
        if msgs:
            parts.append(f"สรุปผล: {msgs}")

    return "\n".join(parts)


def _call_api(prompt: str, max_tokens: int = 1024) -> str:
    """
    ส่ง prompt ไป OpenRouter แล้วคืน response string
    Raise exception ถ้า API error (caller จัดการ)
    """
    response = _client().chat.completions.create(
        model=_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.6,
    )
    return response.choices[0].message.content


# ══════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════

def analyze_with_ai(
    text: str,
    aspect_data: list | None = None,
    insight_data: list | None = None,
) -> str:
    """
    วิเคราะห์รีวิวเชิงลึกด้วย Qwen

    Strategy:
      ถ้ามี aspect_data → ใช้ context summary (ประหยัด token)
      ถ้าไม่มี        → ส่ง review ที่ truncate แล้ว

    Returns:
      markdown analysis string หรือ error message
    """
    ctx   = _build_context(aspect_data, insight_data)
    trunc = _truncate(text, _MAX_REVIEW_CHARS)

    if ctx:
        prompt = (
            f"คุณเป็น AI วิเคราะห์ร้านอาหาร ต่อไปนี้คือข้อมูลที่วิเคราะห์ไว้แล้ว:\n\n"
            f"{ctx}\n\n"
            f"รีวิวต้นฉบับ (บางส่วน):\n\"\"\"{trunc}\"\"\"\n\n"
            f"กรุณาวิเคราะห์เพิ่มเติมเชิงลึกเป็นภาษาไทย ตอบในรูปแบบนี้:\n"
            f"- สิ่งที่ลูกค้าชอบ: ...\n"
            f"- สิ่งที่ลูกค้าบ่น: ...\n"
            f"- ปัญหาหลัก: ...\n"
            f"- ข้อแนะนำ: ..."
        )
    else:
        prompt = (
            f"วิเคราะห์รีวิวร้านอาหารนี้เป็นภาษาไทย:\n\n"
            f"\"\"\"{trunc}\"\"\"\n\n"
            f"ตอบในรูปแบบนี้:\n"
            f"- สิ่งที่ลูกค้าชอบ: ...\n"
            f"- สิ่งที่ลูกค้าบ่น: ...\n"
            f"- ปัญหาหลัก: ...\n"
            f"- ข้อแนะนำ: ..."
        )

    try:
        return _call_api(prompt, max_tokens=1024)
    except Exception as exc:
        return f"❌ วิเคราะห์ไม่สำเร็จ: {exc}"


def chat_with_ai(
    question: str,
    review_text: str = "",
    aspect_data: list | None = None,
    insight_data: list | None = None,
) -> str:
    """
    ตอบคำถาม chatbot โดยใช้ context สรุป (แทนรีวิวเต็ม)

    Context priority:
      1. aspect_data/insight_data summary (กระชับที่สุด)
      2. review_text ที่ truncate  (ถ้าไม่มี aspect)
      3. ไม่มี context (ตอบแบบ general)

    Returns:
      response string หรือ error message
    """
    ctx      = _build_context(aspect_data, insight_data)
    question = _truncate(question, _MAX_CHAT_CHARS)

    # เลือก context block
    if ctx:
        ctx_block = f"ข้อมูลวิเคราะห์:\n{ctx}\n"
    elif review_text.strip():
        ctx_block = f"รีวิว:\n\"{_truncate(review_text, _MAX_REVIEW_CTX)}\"\n"
    else:
        ctx_block = ""

    prompt = (
        f"คุณเป็น AI ผู้ช่วยวิเคราะห์ร้านอาหาร ตอบเป็นภาษาไทย กระชับ ชัดเจน\n\n"
        f"{ctx_block}\n"
        f"คำถาม: {question}\n\n"
        f"ตอบสั้นๆ ได้ใจความ ไม่เกิน 3-4 ประโยค:"
    )

    try:
        return _call_api(prompt, max_tokens=512)
    except Exception as exc:
        return f"❌ ตอบไม่สำเร็จ: {exc}"