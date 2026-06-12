
# 🍽️ The Pro Supervisor – AI วิเคราะห์รีวิวร้านอาหารด้วย NLP

## 📌 Overview

**The Pro Supervisor** คือระบบวิเคราะห์รีวิวร้านอาหารด้วย **Artificial Intelligence (AI)** และ **Natural Language Processing (NLP)** ที่ออกแบบมาเพื่อช่วยเจ้าของร้านสรุปความคิดเห็นของลูกค้าจากรีวิวจำนวนมากได้ภายในไม่กี่วินาที

แทนที่จะต้องอ่านรีวิวทีละข้อความ ระบบสามารถวิเคราะห์และสรุปได้ว่าลูกค้าชอบอะไร ไม่พอใจเรื่องไหน และร้านควรปรับปรุงด้านใด พร้อมแสดงข้อมูลในรูปแบบที่เข้าใจง่ายและนำไปใช้งานได้จริง

ระบบถูกพัฒนาแบบ **Full Stack Web Application** โดยผสาน **Next.js, FastAPI และ Large Language Model (LLM)** เข้ากับเทคนิค NLP สำหรับภาษาไทย เพื่อเปลี่ยนข้อความรีวิวธรรมดาให้กลายเป็นข้อมูลเชิงลึกสำหรับการตัดสินใจทางธุรกิจ

---

# 🚀 จุดเด่นของระบบ

## ✅ วิเคราะห์รีวิวได้ 3 ระดับ

### 🟢 Minimum Mode

วิเคราะห์ความรู้สึกของรีวิวทันที

* จำแนกว่าเป็น Positive หรือ Negative
* แสดงค่า Confidence Score
* ใช้โมเดล **WangchanBERTa** สำหรับภาษาไทย
* เหมาะสำหรับการวิเคราะห์ที่รวดเร็ว

---

### 🟡 Medium Mode

วิเคราะห์รีวิวเชิงลึกแบบ Aspect-Based Sentiment Analysis

แยกความคิดเห็นออกเป็น 4 ด้าน

* 🍜 อาหาร
* 💰 ราคา
* 🤝 การบริการ
* 🏠 บรรยากาศ

พร้อมทั้ง

* คะแนนแต่ละด้าน
* ตัวอย่างประโยคจริงจากรีวิว
* สรุปข้อดีและข้อควรปรับปรุงของแต่ละหมวด

---

### 🔴 Maximum Mode

ใช้ Large Language Model วิเคราะห์เชิงลึก

AI จะสรุป

* ⭐ จุดเด่นของร้าน
* ⚠️ สิ่งที่ลูกค้าบ่นมากที่สุด
* 📊 ปัญหาหลักที่ควรแก้ไข
* 💡 ข้อเสนอแนะในการพัฒนาร้าน

และยังมี **AI Chatbot** ที่สามารถพูดคุยและตอบคำถามเพิ่มเติมเกี่ยวกับผลการวิเคราะห์ได้แบบ Real-time

---

# 🏗️ System Architecture

```
Frontend (Next.js)

        │

        ▼

 FastAPI Backend

        │

        ▼

   NLP Pipeline

        │

        ▼

  LLM Deep Analysis

        │

        ▼

 Dashboard & AI Chatbot
```

ผู้ใช้สามารถพิมพ์ข้อความหรืออัปโหลดไฟล์รีวิว จากนั้น Frontend จะส่งข้อมูลไปยัง Backend เพื่อเลือก NLP Pipeline ตามโหมดที่ใช้งาน และส่งผลลัพธ์กลับมาแสดงผลผ่าน Dashboard แบบ Interactive

---

# 🧠 AI & NLP Technologies

ระบบนำเทคนิคด้าน AI และ NLP หลายส่วนมาทำงานร่วมกัน เช่น

* WangchanBERTa
* PyThaiNLP
* Thai Tokenization
* Negation-aware Processing
* Aspect-Based Sentiment Analysis
* Context Compression
* Prompt Engineering
* Large Language Model (LLM)

เพื่อให้สามารถเข้าใจบริบทของภาษาไทยได้แม่นยำมากขึ้น

---

# ⚡ Performance Optimization

เพื่อให้ระบบทำงานได้รวดเร็วและประหยัดทรัพยากร มีการออกแบบให้รองรับ

* 🚀 Model Caching
* 🚀 Result Caching
* 🚀 Lazy Loading
* 🚀 Context Compression ก่อนส่งเข้า LLM
* 🚀 API Timeout Handling
* 🚀 Optimized NLP Pipeline

ช่วยลดเวลาในการประมวลผลและลดค่าใช้จ่ายในการเรียกใช้ AI ได้อย่างมีประสิทธิภาพ

---

# 💻 Tech Stack

## Frontend

* Next.js
* React
* JavaScript
* HTML
* CSS

## Backend

* FastAPI
* Python

## AI / NLP

* WangchanBERTa
* PyThaiNLP
* OpenRouter API
* Qwen 2.5-72B

## Data Support

* TXT
* CSV
* XLSX

---

# 🎯 Problem Statement

ร้านอาหารจำนวนมากได้รับรีวิวจาก Google Maps หรือแพลตฟอร์มต่าง ๆ หลายร้อยถึงหลายพันข้อความ ทำให้การอ่านและวิเคราะห์ด้วยตนเองเป็นเรื่องที่ใช้เวลามาก และอาจมองไม่เห็นปัญหาที่แท้จริง

โปรเจกต์นี้จึงถูกพัฒนาขึ้นเพื่อเปลี่ยนรีวิวจำนวนมากให้เป็น **ข้อมูลเชิงลึกที่สรุปได้อัตโนมัติ** ช่วยให้เจ้าของร้านรู้ว่าควรพัฒนาด้านใดก่อน และสามารถนำความคิดเห็นของลูกค้าไปใช้ปรับปรุงธุรกิจได้อย่างมีประสิทธิภาพ

---

# 📈 Future Improvements

* เชื่อมต่อ Google Maps API อัตโนมัติ
* รองรับการวิเคราะห์รีวิวแบบ Real-time
* พัฒนาความสามารถในการตรวจจับคำประชด (Sarcasm Detection)
* เพิ่มความเข้าใจบริบทของภาษาไทย
* สร้าง Dashboard และ Business Report แบบอัตโนมัติ

---

# 🌟 Why This Project?

โปรเจกต์นี้เป็นการผสานความรู้ด้าน

* 💻 Full Stack Development
* 🤖 Artificial Intelligence
* 🧠 Natural Language Processing
* 📊 Business Analytics
* ⚙️ Software Architecture

เข้าด้วยกัน เพื่อสร้างระบบที่สามารถเปลี่ยน "ข้อความรีวิว" ให้กลายเป็น "ข้อมูลที่ช่วยตัดสินใจทางธุรกิจ" ได้จริง และสามารถต่อยอดใช้งานในระดับ Production ได้ในอนาคต

## โค้ดเต็มอยู่ที่ master  
# canva https://canva.link/kmue8tnm4khjl07
