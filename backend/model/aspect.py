"""
aspect.py — Thai restaurant review aspect-based sentiment analysis
══════════════════════════════════════════════════════════════════

Public API
──────────
  aspect_analysis(text)        → list[dict]   single review
  aspect_analysis_multi(texts) → list[dict]   aggregated multi-review
  generate_insight(aspects)    → list[dict]

AspectResult shape:
  { name, score, pos_count, neg_count, total_mentions,
    matched_pos: list[str], matched_neg: list[str] }

InsightResult shape:
  { type: "positive"|"negative"|"neutral", aspect: str, message: str }
"""

from __future__ import annotations

import re
from pythainlp.tokenize import word_tokenize

# ══════════════════════════════════════════════════════════════════
# CONSTANTS & KEYWORD DICTIONARIES
# ══════════════════════════════════════════════════════════════════

# คำปฏิเสธ — token ถัดไป NEGATION_WINDOW ตัวจะถูก flip polarity
NEGATION_WORDS: frozenset[str] = frozenset({
    "ไม่", "ไม่ได้", "ไม่เคย", "ไม่ค่อย", "แทบ", "ยัง",
})

# คำเสริม — ไม่มีความหมาย sentiment, ไม่นับ negation window
INTENSIFIERS: frozenset[str] = frozenset({
    "มาก", "สุด", "ๆ", "เลย", "มากๆ", "มากเลย", "สุดๆ",
    "เกิน", "โคตร", "เวอร์", "ด้วย", "แต่", "และ", "ก็",
})

NEGATION_WINDOW       = 1    # tokens หลัง negation ที่ถือว่า negated
MAX_EXAMPLES          = 3    # matched sentences สูงสุดต่อ aspect ต่อ polarity
EVIDENCE_MAX_LEN      = 60   # sentence ≤ 60 chars ผ่านทันที ไม่สน strength
EVIDENCE_MIN_STRENGTH = 2    # sentence > 60 chars ต้องการ net strength ≥ 2

# กฎ exclude false-positive เช่น "รอคิว" ≠ บริการช้า
EXCLUDE_CONTEXT: dict[str, list[str]] = {
    "service_neg": [
        r"รอคิว", r"จองคิว", r"คิวนาน", r"คิวยาว",
        r"dqueue", r"แอพ.*คิว", r"คิว.*แอพ",
    ],
}

ASPECTS: dict[str, dict[str, set[str]]] = {
    "food": {
        "positive": {
            "อร่อย", "อร่อยมาก", "อร่อยจริง", "หอม", "กรอบ", "นุ่ม",
            "สด", "สดใหม่", "อาหารสด", "วัตถุดิบดี", "คุณภาพดี",
            "รสชาติดี", "รสดี", "ปรุงรสดี", "เข้มข้น", "รสจัด", "ถูกปาก",
            "ดี", "เยี่ยม", "เด็ด", "โดน", "ถูกใจ", "ชอบมาก", "ประทับใจ",
            "ร้อน",   # ของร้อน = เพิ่งทำ = บวก
        },
        "negative": {
            "จืด", "จืดชืด", "เค็ม", "เปรี้ยว", "เหม็น", "คาว", "คาวจัด",
            "แข็ง", "เหนียว", "เก่า", "มันเยิ้ม", "รสแปลก",
            "แย่", "ห่วย", "ผิดหวัง", "ไม่ดี",
            "เย็น",   # อาหารเย็น = ทำนาน = ลบ
        },
    },
    "price": {
        "positive": {
            "ถูก", "ราคาถูก", "ราคาย่อมเยา", "ราคาน่ารัก",
            "คุ้ม", "คุ้มค่า", "คุ้มราคา",
            "ราคาดี", "ราคาโอเค", "ราคาเหมาะสม", "ราคาสมเหตุสมผล",
            "ราคาเป็นมิตร", "จ่ายได้", "ไม่แพง",
        },
        "negative": {
            "แพง", "ราคาแพง", "ราคาสูง", "แพงเกิน", "แพงเกินจริง",
            "ไม่คุ้ม", "ไม่คุ้มราคา", "เสียดายเงิน", "ราคาโอเวอร์",
        },
    },
    "service": {
        "positive": {
            "บริการดี", "พนักงานดี", "พนักงานใจดี",
            "เสิร์ฟเร็ว", "เสิร์ฟไว", "อาหารเร็ว", "อาหารไว",
            "service mind", "รวดเร็ว", "ใจดี", "ยิ้มแย้ม", "เป็นกันเอง",
            "สุภาพ", "ดูแลดี", "เอาใจใส่", "ตั้งใจ",
            "น่ารัก", "อัธยาศัยดี", "ดูแล", "ใส่ใจ", "ประทับใจ",
        },
        "negative": {
            "ช้า", "บริการแย่", "บริการห่วย", "รอนาน", "นาน",
            "หยาบ", "หยาบคาย", "พนักงานหยาบ",
            "ไม่สนใจ", "เฉยเมย", "ไม่ใส่ใจ",
            "ไม่ยิ้ม", "ไม่สุภาพ", "ไม่เป็นมิตร", "หน้าบึ้ง",
            "เสิร์ฟช้า", "ไม่เต็มใจ", "ไม่ประทับใจ",
        },
    },
    "atmosphere": {
        "positive": {
            "บรรยากาศดี", "บรรยากาศเยี่ยม", "บรรยากาศสบาย",
            "บรรยากาศโรแมนติก", "สวยงาม", "สวย", "ตกแต่งสวย",
            "สะอาด", "สะอาดสะอ้าน", "น่านั่ง", "น่าอยู่", "ชิล",
            "เงียบสงบ", "เงียบ", "สถานที่ดี", "สถานที่สวย",
            "กว้าง", "ที่นั่งกว้าง",
        },
        "negative": {
            "บรรยากาศแย่", "บรรยากาศห่วย",
            "สกปรก", "ไม่สะอาด", "เสียงดัง", "แออัด",
            "อากาศร้อน", "ร้านร้อน", "มีกลิ่น", "แคบ",
            "ที่นั่งน้อย", "อึดอัด", "ไม่สะดวก",
        },
    },
}

LABEL_MAP: dict[str, str] = {
    "food": "อาหาร", "price": "ราคา",
    "service": "บริการ", "atmosphere": "บรรยากาศ",
}

# reverse: ภาษาไทย → key (ใช้ใน EXCLUDE_CONTEXT lookup)
ASPECT_KEY: dict[str, str] = {v: k for k, v in LABEL_MAP.items()}

INSIGHTS: dict[str, tuple[int, str, str]] = {
    "อาหาร": (70,
        "ลูกค้าพอใจด้านรสชาติและคุณภาพอาหาร",
        "อาหารยังไม่ถูกใจลูกค้า ควรปรับปรุงรสชาติและคุณภาพ"),
    "ราคา": (70,
        "ลูกค้ามองว่าราคาคุ้มค่าและสมเหตุสมผล",
        "ลูกค้ารู้สึกว่าราคาแพงเกินไป ควรพิจารณาปรับราคาหรือเพิ่มคุณค่า"),
    "บริการ": (70,
        "บริการได้รับคำชมด้านความรวดเร็วและความใส่ใจ",
        "บริการล่าช้าหรือพนักงานไม่ใส่ใจ ควรฝึกอบรมเพิ่มเติม"),
    "บรรยากาศ": (70,
        "บรรยากาศร้านสวยงาม สะอาด ลูกค้าชื่นชอบ",
        "บรรยากาศร้านต้องปรับปรุง ความสะอาดและความเป็นระเบียบ"),
}


# ══════════════════════════════════════════════════════════════════
# COMPILED REGEXES  (compile ครั้งเดียวตอน import เพื่อ performance)
# ══════════════════════════════════════════════════════════════════

_RE_URL = re.compile(r"https?://\S+")
_RE_HL  = re.compile(r"\b(hl|lang)=[a-z]{2}\b", re.IGNORECASE)
_RE_WS  = re.compile(r"[ \t]{2,}")
_RE_NL  = re.compile(r"\n{3,}")
_RE_HL_SOL = re.compile(r"(?m)^(en|th)\s+", re.IGNORECASE)

# " DIGIT NAME " ก่อน Thai/dash/emoji — Google Maps primary format
_RE_META = re.compile(
    r" [1-5]"
    r" (?:[A-Za-zก-๛][A-Za-zก-๛ ]{1,50})"
    r"(?=\s*[\u0e00-\u0e7f\-\u2013\u2022\n"
    r"\U0001F300-\U0001FAFF\U00002600-\U000027BF])",
)

# Firstname Lastname ก่อน Thai (fallback A — ไม่มีคะแนนดาวนำ)
_RE_LATIN_NAME = re.compile(
    r"^[A-Za-z][A-Za-z ]{2,50}\s+(?=[\u0e00-\u0e7f])",
)

# ALL-CAPS brand prefix ก่อน Thai (fallback B)
_RE_CAPS = re.compile(r"^(?:[A-Z][A-Z0-9 ]{4,})\s+(?=[\u0e00-\u0e7f])")

# Sentence splitting
_RE_SENT_SPLIT  = re.compile(r"[!?।\n]+")
_RE_COMMA_SPLIT = re.compile(r"\s*,\s*(?=[ก-๛A-Za-z\-])")
_RE_INNER_SPLIT = re.compile(r"[,،、。]+")
_RE_LEAD_SYM    = re.compile(r"^[-–•\s]+")

# Normalization
_RE_REPEAT_CHAR    = re.compile(r"([ก-ฮ\u0e30-\u0e4e])\1{2,}")
_RE_REPEAT_MAIYAMOK = re.compile(r"ๆ+")


# ══════════════════════════════════════════════════════════════════
# TEXT CLEANING
# ══════════════════════════════════════════════════════════════════

def clean_review_text(text: str) -> str:
    """
    ลบ metadata (title, url, stars, name, reviewUrl) ออกจากต้น text

    รองรับ Google Maps CSV ทุกรูปแบบ:
      A) "SHOP URL STARS FIRSTNAME LASTNAME REVIEW_URL Thai_text"
      B) "Shop Thai URL STARS Name URL Thai_text"   ← title มี Thai
      C) "Shop Name STARS Name Thai_text"            ← ไม่มี URL
      D) "Shop Name STARS Name -dash_text"

    หมายเหตุ: FileUpload.js ใหม่ extract column "text" ตรงแล้ว
    ฟังก์ชันนี้เป็น safety-net สำหรับ plain-text / edge case
    """
    if not text:
        return ""

    text = _RE_URL.sub("", text)           # 1. ลบ URL ทั้งหมด
    text = _RE_HL.sub("", text)            # 2. ลบ hl=en / lang=th
    text = _RE_WS.sub(" ", text).strip()   # 3. collapse whitespace

    # 4. ลบ metadata header ด้วย 3 strategy
    m = _RE_META.search(text)
    if m:
        text = text[m.end():].strip()      # strategy A — primary
    else:
        text = _RE_LATIN_NAME.sub("", text)  # strategy B — Latin name fallback
        text = _RE_CAPS.sub("", text)        # strategy C — CAPS brand fallback

    text = _RE_HL_SOL.sub("", text)        # 5. ลบ "en "/"th " ต้นบรรทัด
    text = _RE_WS.sub(" ", text)           # 6. final cleanup
    text = _RE_NL.sub("\n\n", text)

    return text.strip()


# ══════════════════════════════════════════════════════════════════
# NORMALIZATION & TOKENIZATION
# ══════════════════════════════════════════════════════════════════

def _normalize(text: str) -> str:
    """ลด repeated chars + normalize ๆ ซ้ำ + lowercase"""
    text = _RE_REPEAT_CHAR.sub(r"\1", text)
    text = _RE_REPEAT_MAIYAMOK.sub("ๆ", text)
    return text.lower()


def _split_sentences(text: str) -> list[str]:
    """
    แบ่ง text → sentence fragments
    Pipeline: ! ? \\n → comma → กรอง < 5 chars → ตัด > 120 chars
    """
    parts: list[str] = []
    for part in _RE_SENT_SPLIT.split(text):
        parts.extend(_RE_COMMA_SPLIT.split(part))

    result: list[str] = []
    for s in parts:
        s = _RE_LEAD_SYM.sub("", s).strip()
        if len(s) < 5:
            continue
        if len(s) > 120:
            inner = _RE_INNER_SPLIT.split(s)
            s = (inner[0].strip() if inner else s[:120])
        if len(s) >= 5:
            result.append(s)

    return result or [text.strip()]


def _tokenize_negation(text: str) -> list[tuple[str, bool]]:
    """
    Tokenize แล้ว mark is_negated ต่อ token

    กฎ:
    - negation word → เปิด window (neg_remaining = NEGATION_WINDOW)
    - intensifier → ข้ามได้ ไม่ consume window
    - token ปกติ → append (tok, is_neg) + bigram กับ token ถัดไป
    """
    tokens = [t for t in word_tokenize(_normalize(text), engine="newmm") if t.strip()]
    result: list[tuple[str, bool]] = []
    neg_rem = 0

    for i, tok in enumerate(tokens):
        if tok in NEGATION_WORDS:
            neg_rem = NEGATION_WINDOW
            continue

        is_neg = neg_rem > 0
        if tok not in INTENSIFIERS:
            neg_rem = max(0, neg_rem - 1)
            result.append((tok, is_neg))

            # bigram: tok + next non-intensifier/non-negation token
            j = i + 1
            while j < len(tokens) and tokens[j] in INTENSIFIERS:
                j += 1
            if j < len(tokens) and tokens[j] not in NEGATION_WORDS:
                result.append((tok + tokens[j], is_neg))

    return result


# ══════════════════════════════════════════════════════════════════
# SCORING HELPERS
# ══════════════════════════════════════════════════════════════════

def _score(text: str, pos_kws: set[str], neg_kws: set[str]) -> tuple[int, int]:
    """นับ pos/neg signal ใน text (negated positive → neg และกลับกัน)"""
    pos = neg = 0
    for tok, is_neg in _tokenize_negation(text):
        if tok in pos_kws:
            neg += is_neg; pos += not is_neg
        elif tok in neg_kws:
            pos += is_neg; neg += not is_neg
    return pos, neg


def _classify(
    sentence: str, pos_kws: set[str], neg_kws: set[str],
) -> tuple[str | None, int]:
    """
    ระบุ polarity ของ sentence เดียว
    Returns ("pos"|"neg"|None, net_strength)
    """
    net = 0
    for tok, is_neg in _tokenize_negation(sentence):
        if tok in pos_kws:
            net += -1 if is_neg else 1
        elif tok in neg_kws:
            net += 1 if is_neg else -1
    if net > 0: return "pos", net
    if net < 0: return "neg", abs(net)
    return None, 0


def _excluded(sentence: str, aspect_label: str, pol: str) -> bool:
    """ตรวจ EXCLUDE_CONTEXT — True ถ้าควร skip sentence นี้"""
    key = f"{ASPECT_KEY.get(aspect_label, aspect_label)}_{pol}"
    low = sentence.lower()
    return any(re.search(p, low, re.IGNORECASE) for p in EXCLUDE_CONTEXT.get(key, []))


def _qualifies(sentence: str, strength: int) -> bool:
    """sentence สั้น → ผ่านเสมอ; ยาว → ต้องการ strength เพียงพอ"""
    return len(sentence) <= EVIDENCE_MAX_LEN or strength >= EVIDENCE_MIN_STRENGTH


def _collect(
    sentences: list[str],
    pos_kws: set[str], neg_kws: set[str],
    label: str,
    matched_pos: list[str], matched_neg: list[str],
) -> None:
    """
    วนหา evidence sentences แล้ว append in-place
    หยุดเร็วเมื่อทั้งสองฝั่งเต็ม MAX_EXAMPLES แล้ว
    """
    for sent in sentences:
        if len(matched_pos) >= MAX_EXAMPLES and len(matched_neg) >= MAX_EXAMPLES:
            break
        pol, strength = _classify(sent, pos_kws, neg_kws)
        if pol is None or not _qualifies(sent, strength) or _excluded(sent, label, pol):
            continue
        bucket = matched_pos if pol == "pos" else matched_neg
        if len(bucket) < MAX_EXAMPLES and sent not in bucket:
            bucket.append(sent)


def _build_result(
    label: str, pos: int, neg: int,
    matched_pos: list[str], matched_neg: list[str],
) -> dict:
    """สร้าง AspectResult dict"""
    total = pos + neg
    return {
        "name": label,
        "score": int(pos / total * 100) if total else 50,
        "pos_count": pos,
        "neg_count": neg,
        "total_mentions": total,
        "matched_pos": matched_pos,
        "matched_neg": matched_neg,
    }


# ══════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════

def aspect_analysis(text: str) -> list[dict]:
    """วิเคราะห์ aspect สำหรับ review text เดียว"""
    text = clean_review_text(text)
    sents = _split_sentences(text)
    results: list[dict] = []

    for key, kws in ASPECTS.items():
        label = LABEL_MAP[key]
        pos_kws, neg_kws = kws["positive"], kws["negative"]
        pos, neg = _score(text, pos_kws, neg_kws)
        mp, mn = [], []
        _collect(sents, pos_kws, neg_kws, label, mp, mn)
        results.append(_build_result(label, pos, neg, mp, mn))

    return results


def aspect_analysis_multi(reviews: list[str]) -> list[dict]:
    """
    วิเคราะห์ aspect สำหรับหลาย review แล้ว aggregate ผลรวม
    Input: raw strings (clean / uncleaned ก็ได้)
    """
    agg: dict[str, dict] = {
        label: {"pos": 0, "neg": 0, "matched_pos": [], "matched_neg": []}
        for label in LABEL_MAP.values()
    }

    for raw in reviews:
        if not raw or not str(raw).strip():
            continue
        text  = clean_review_text(str(raw))
        sents = _split_sentences(text)

        for key, kws in ASPECTS.items():
            label = LABEL_MAP[key]
            acc   = agg[label]
            pos_kws, neg_kws = kws["positive"], kws["negative"]

            p, n = _score(text, pos_kws, neg_kws)
            acc["pos"] += p
            acc["neg"] += n
            _collect(sents, pos_kws, neg_kws, label,
                     acc["matched_pos"], acc["matched_neg"])

    return [
        _build_result(label, d["pos"], d["neg"], d["matched_pos"], d["matched_neg"])
        for label, d in agg.items()
    ]


def generate_insight(aspects: list[dict]) -> list[dict]:
    """
    สร้าง insight จาก aspect scores
    ≥70 → positive  |  <40 → negative  |  อื่น → neutral
    """
    insights: list[dict] = []

    for item in aspects:
        name, score = item["name"], item["score"]
        if name not in INSIGHTS:
            continue
        threshold, pos_msg, neg_msg = INSIGHTS[name]

        if score >= threshold:
            insights.append({"type": "positive", "aspect": name, "message": pos_msg})
        elif score < 40:
            insights.append({"type": "negative", "aspect": name, "message": neg_msg})
        else:
            insights.append({
                "type": "neutral", "aspect": name,
                "message": f"{name}อยู่ในเกณฑ์ปานกลาง ยังมีโอกาสพัฒนาได้",
            })

    return insights or [
        {"type": "neutral", "aspect": "ทั่วไป", "message": "ไม่พบข้อมูลเชิงลึกที่ชัดเจน"}
    ]


# ══════════════════════════════════════════════════════════════════
# CLI SELF-TEST  →  python aspect.py
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import json, sys

    if "--serve" in sys.argv:
        # Flask standalone mode
        try:
            from flask import Flask, request, jsonify
            from flask_cors import CORS
        except ImportError:
            print("pip install flask flask-cors"); raise SystemExit(1)

        app = Flask(__name__)
        CORS(app)

        @app.route("/analyze", methods=["GET", "POST"])
        def analyze():
            if request.method == "POST":
                data    = request.get_json(force=True) or {}
                reviews = data.get("reviews", [])
                if isinstance(reviews, str):
                    reviews = [reviews]
            else:
                t       = request.args.get("text", "")
                reviews = [t] if t else []
            if not reviews:
                return jsonify({"error": "no reviews provided"}), 400
            aspects  = aspect_analysis_multi(reviews)
            insights = generate_insight(aspects)
            return jsonify({"aspects": aspects, "insights": insights})

        print("Serving on http://localhost:5050")
        app.run(host="0.0.0.0", port=5050, debug=False)
        raise SystemExit

    # ── Unit tests ────────────────────────────────────────────────
    TESTS = [
        # Format A: URL + star + Latin name
        "Okii Katsu https://maps.google.com 1 Natthawut Diamond https://maps.google.com/reviews?hl=en อาหารเฉยๆ เจ้าของร้านพูดจาไม่สนใจลูกค้า แย่ครับ",
        # Format A: short name
        "HOTPOTMAN SHABU MALA RAMA 2 https://maps.google.com 5 Nirun S https://reviews?hl=en สายหมาล่าห้ามพลาด อร่อย สะอาด บริการเริ่ด วัตถุดิบดี คุ้มค่ามาก",
        # Format B: Thai in title
        "Eat Am Are เซ็นทรัล พระราม 2 https://maps.google.com 2 Min https://reviews?hl=en -อาหารเย็น ของทอดเหนียว บริการแย่",
        # Format C: no URL, Thai name
        "HOTPOTMAN 5 ณัฐพล คำเอก อาหารอร่อยมากๆ บริการดีมาก ประทับใจ",
        # Format C: no URL, long Latin name
        "Okii Katsu 1 Suvichan Sthitgitpichead เมื่อวานไปทานมาไม่ประทับใจ บริการไม่ดี",
        # Clean text (จาก FileUpload ที่ extract column text แล้ว)
        "อร่อย สะอาด บริการรวดเร็ว ราคาคุ้มค่า ชอบมาก",
    ]

    print("═" * 60)
    print("clean_review_text() tests")
    print("═" * 60)
    for t in TESTS:
        print(f"  IN : {t[:70]}")
        print(f"  OUT: {clean_review_text(t)[:70]}")
        print()

    print("═" * 60)
    print("aspect_analysis_multi()")
    print("═" * 60)
    result = {"aspects": aspect_analysis_multi(TESTS), "insights": generate_insight(aspect_analysis_multi(TESTS))}
    print(json.dumps(result, ensure_ascii=False, indent=2))