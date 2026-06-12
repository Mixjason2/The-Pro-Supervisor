"""
main.py — FastAPI backend for The Pro Supervisor
══════════════════════════════════════════════════

Endpoints:
  GET  /              health check
  POST /analyze       วิเคราะห์ review (mode: minimum | medium | max)
  POST /chat          chatbot endpoint

Request/Response schemas ใช้ Pydantic v2
CORS เปิดทุก origin (ปรับใน production)
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# โหลด .env ก่อน import module อื่น
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from model.sentiment import analyze_sentiment          # noqa: E402
from model.aspect    import aspect_analysis, generate_insight  # noqa: E402
from model.chatbot   import analyze_with_ai, chat_with_ai      # noqa: E402


# ══════════════════════════════════════════════════════════════════
# LIFESPAN — warm up model ตอน startup
# ══════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up sentiment model ตอน server start เพื่อลด cold-start latency"""
    try:
        analyze_sentiment("test warmup")
        print("✅ sentiment model warmed up")
    except Exception as exc:
        print(f"⚠️  sentiment warmup skipped: {exc}")
    yield


# ══════════════════════════════════════════════════════════════════
# APP SETUP
# ══════════════════════════════════════════════════════════════════

app = FastAPI(
    title="The Pro Supervisor API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # TODO: จำกัด origin ใน production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
# SCHEMAS  (Pydantic v2)
# ══════════════════════════════════════════════════════════════════

class AnalyzeRequest(BaseModel):
    """Request body สำหรับ /analyze"""
    text: str = Field(..., min_length=1, description="Review text (raw หรือ pre-cleaned)")
    mode: str = Field(..., pattern="^(minimum|medium|max)$", description="Analysis mode")

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("text must not be blank")
        return stripped


class AspectItem(BaseModel):
    """Aspect score item สำหรับ context ใน chat"""
    name:           str
    score:          int
    pos_count:      int = 0
    neg_count:      int = 0
    total_mentions: int = 0


class InsightItem(BaseModel):
    """Insight item สำหรับ context ใน chat"""
    type:    str
    aspect:  str
    message: str


class ChatRequest(BaseModel):
    """Request body สำหรับ /chat"""
    question:     str                    = Field(..., min_length=1)
    review_text:  str                    = Field(default="")
    aspect_data:  list[AspectItem] | None = None
    insight_data: list[InsightItem] | None = None

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("question must not be blank")
        return stripped


# ══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
def root() -> dict:
    """Health check"""
    return {"status": "ok", "message": "🔥 The Pro Supervisor API is running"}


@app.post("/analyze", tags=["Analysis"])
def analyze(req: AnalyzeRequest) -> dict:
    """
    วิเคราะห์ review text

    Modes:
      minimum → WangchanBERTa sentiment score
      medium  → aspect analysis + insights
      max     → aspect + insights + AI deep analysis
    """
    text = req.text
    mode = req.mode

    # ── Minimum mode ─────────────────────────────────────────────
    if mode == "minimum":
        return {"mode": mode, "result": analyze_sentiment(text)}

    # ── Medium mode ──────────────────────────────────────────────
    if mode == "medium":
        aspects  = aspect_analysis(text)
        insights = generate_insight(aspects)
        return {"mode": mode, "aspect": aspects, "insight": insights}

    # ── Max mode ─────────────────────────────────────────────────
    # aspect ก่อน → ส่งเป็น context ให้ AI (ประหยัด token)
    if mode == "max":
        try:
            aspects  = aspect_analysis(text)
            insights = generate_insight(aspects)
            analysis = analyze_with_ai(
                text=text,
                aspect_data=aspects,
                insight_data=insights,
            )
            return {
                "mode":     mode,
                "aspect":   aspects,
                "insight":  insights,
                "analysis": analysis,
            }
        except Exception as exc:
            # ส่ง error กลับไปแทนการ crash ทั้ง server
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI analysis failed: {exc}",
            ) from exc

    # Guard — ไม่ควรถึงจุดนี้เพราะ Pydantic validate mode แล้ว
    raise HTTPException(status_code=400, detail=f"Unknown mode: {mode}")


@app.post("/chat", tags=["Chat"])
def chat(req: ChatRequest) -> dict:
    """
    Chatbot endpoint — ตอบคำถามเกี่ยวกับรีวิว

    Context priority:
      aspect_data + insight_data > review_text > none
    """
    try:
        aspect_list  = [a.model_dump() for a in req.aspect_data]  if req.aspect_data  else None
        insight_list = [i.model_dump() for i in req.insight_data] if req.insight_data else None

        answer = chat_with_ai(
            question    = req.question,
            review_text = req.review_text,
            aspect_data = aspect_list,
            insight_data= insight_list,
        )
        return {"answer": answer}

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Chat failed: {exc}",
        ) from exc