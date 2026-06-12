"""
sentiment.py — Thai sentiment classification via WangchanBERTa
══════════════════════════════════════════════════════════════

Public API
──────────
  analyze_sentiment(text) → { sentiment, Reliability, fallback? }

  sentiment: "positive" | "negative" | "neutral"
  Reliability: float 0-1  (model confidence)
  fallback: True          (ถ้า model โหลดไม่สำเร็จ)

หมายเหตุ:
  - Model โหลดครั้งแรกเท่านั้น (lazy + lru_cache)
  - Input ถูก truncate ที่ 500 chars (ขีด BERT max_length)
  - lru_cache(1000) ป้องกัน duplicate inference บน text เดิม
"""

from __future__ import annotations

from functools import lru_cache

# ── Label normalization map ────────────────────────────────────────
_LABEL_MAP: dict[str, str] = {
    "pos":      "positive",
    "neg":      "negative",
    "neu":      "neutral",
    "positive": "positive",
    "negative": "negative",
    "neutral":  "neutral",
}

_MODEL_NAME = "poom-sci/WangchanBERTa-finetuned-sentiment"
_MAX_CHARS  = 500   # BERT truncation limit


# ══════════════════════════════════════════════════════════════════
# MODEL LOADING (lazy, cached)
# ══════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1)
def _get_pipeline():
    """
    โหลด HuggingFace pipeline ครั้งแรกที่เรียก
    คืน None ถ้าโหลดไม่สำเร็จ (fallback mode)
    """
    try:
        from transformers import pipeline as hf_pipeline  # type: ignore
        model = hf_pipeline(
            "text-classification",
            model=_MODEL_NAME,
            tokenizer=_MODEL_NAME,
        )
        print(f"✅ sentiment model loaded: {_MODEL_NAME}")
        return model
    except Exception as exc:
        print(f"❌ sentiment model load failed: {exc}")
        return None


# ══════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════

@lru_cache(maxsize=1000)
def analyze_sentiment(text: str) -> dict:
    """
    วิเคราะห์ sentiment ของ text

    Args:
      text: review string (raw — truncation จัดการภายใน)

    Returns:
      { sentiment: str, Reliability: float }
      หรือ { sentiment: "neutral", Reliability: 0.0, fallback: True }
      ถ้า model ไม่พร้อมใช้งาน
    """
    model = _get_pipeline()

    # ── Fallback: model ไม่พร้อม ─────────────────────────────────
    if model is None:
        return {"sentiment": "neutral", "Reliability": 0.0, "fallback": True}

    try:
        raw_label = model(text[:_MAX_CHARS])[0]
        return {
            "sentiment":   _LABEL_MAP.get(raw_label["label"].lower(), "neutral"),
            "Reliability": round(float(raw_label["score"]), 4),
        }
    except Exception as exc:
        # ── Runtime error: คืน fallback แทนการ crash ──────────────
        print(f"❌ sentiment inference error: {exc}")
        return {"sentiment": "neutral", "Reliability": 0.0, "fallback": True}