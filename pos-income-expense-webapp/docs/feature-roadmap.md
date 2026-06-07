# Feature Roadmap — ฟีเจอร์ที่ควรทำต่อ

> อัปเดทจากสถานะโปรเจกต์หลังเชื่อม Supabase API + kiosk login  
> โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย (ไม่ใช่ POS ขายสินค้าเต็มรูปแบบ)  
> ลูกค้า: ธุรกิจวัสดุก่อสร้าง / อุปกรณ์ช่าง / จัดสวน

---

## ทีมและบทบาท

| คน | GitHub / ชื่อเรียก | รับผิดชอบ |
|----|-------------------|-----------|
| **Mark** | Markrock342 | Architecture, hardware, review PR, ตัดสินใจทิศทาง |
| **bank** | bankneedtosleep | **Frontend** — หน้า UI, components, UX, เชื่อม API ฝั่ง client |
| **น็อต** | Shonthaya | **Backend** — API routes, Supabase, validation, business logic |

**Branch แนะนำ**
- bank → `feature/frontend-*`
- น็อต → `feature/backend-*`

---

## สถานะปัจจุบัน (สรุป)

| ส่วน | สถานะ | คนที่ทำล่าสุด |
|------|--------|---------------|
| บันทึกรายรับ/รายจ่าย (เพิ่ม) | ✅ ต่อ Supabase แล้ว | bank + Mark |
| ดูรายการ / Dashboard / รายงาน | ✅ ดึงจาก API (หรือ Mock toggle) | bank + Mark |
| Login PIN (kiosk) | ✅ ลูกค้า `lcs` / dev `dev` | bank |
| Supabase schema + API พื้นฐาน | ✅ | น็อต |
| แก้/ยกเลิกรายการ | ❌ | — |
| ปิดยอดนับเงินสด | ❌ มี API แต่ไม่มีหน้า UI | — |
| หมวดหมู่ | ⚠️ หน้า UI ยังใช้ in-memory store | bank ต้องต่อ API |
| ตั้งค่าร้าน (บันทึกจริง) | ❌ UI มี แต่ยังไม่ save | bank ต้องต่อ API |
| พิมพ์ใบเสร็จ / ลิ้นชัก | ❌ placeholder | Mark (hardware) |
| PWA / Deploy production | ❌ | Mark |

---

## P0 — ควรทำก่อน (ใช้งานร้านได้จริง)

### 1. แก้ / ยกเลิกรายการ (Void / Edit)

ตอนนี้บันทึกได้อย่างเดียว — กรอกผิดแล้วแก้ไม่ได้

#### น็อต (Backend) — ทำก่อน

- [ ] สร้าง `src/app/api/transactions/[id]/route.ts`
  - `GET` — ดึงรายการเดียว
  - `PUT` — แก้ title, amount, category, note, paymentMethod, transactionDate
- [ ] สร้าง `src/app/api/transactions/[id]/void/route.ts`
  - `POST` — ตั้ง `status=void`, บันทึก `voidReason`, `voidedBy`, `voidedAt`
- [ ] เพิ่ม Zod validation ใน API (ใช้ `src/lib/validations/transaction.ts`)
- [ ] อัปเดต `src/lib/services/db/transactions.ts` — `updateTransaction`, `voidTransaction` (มีฟังก์ชันแล้ว ตรวจให้ map field ครบ)
- [ ] ทดสอบด้วย Postman / curl ก่อนส่งมอบ bank

#### bank (Frontend) — ทำหลัง API พร้อม

- [ ] เพิ่มปุ่ม **แก้** / **ยกเลิก** ใน `TransactionTable.tsx`
- [ ] หน้าแก้รายการ `/income/[id]/edit`, `/expense/[id]/edit` (reuse `TransactionForm`)
- [ ] Dialog ยืนยันยกเลิก + ช่องกรอกเหตุผล
- [ ] เรียก `PUT /api/transactions/[id]` และ `POST /api/transactions/[id]/void`
- [ ] Toast สำเร็จ/ล้มเหลว + refresh รายการ

**ทำไมสำคัญ:** ร้านจริงกรอกผิดบ่อย ต้องมีทางแก้

---

### 2. ปิดยอด / นับเงินสดประจำวัน

มี API `cash-counts` แล้ว แต่ยังไม่มีหน้า UI

**สูตร**
```
ยอดคาด = เงินเปิดร้าน + รายรับเงินสด − รายจ่ายเงินสด
ส่วนต่าง = นับจริง − ยอดคาด (ขาด / เกิน)
```

#### น็อต (Backend)

- [ ] สร้าง `GET /api/cash-counts/today` — ดึงยอดวันนี้ (ถ้ามีแล้ว return, ถ้าไม่มี return null + expected คำนวณ)
- [ ] ตรวจ `src/lib/services/db/cashCounts.ts` — คำนวณ `expectedBalance` จาก transactions เงินสด
- [ ] `POST /api/cash-counts` — รับ `openingBalance`, `actualBalance`, คำนวณ `variance` + `status` (balanced/short/overage)
- [ ] เอกสาร API ใน PR ว่า bank ต้องส่ง field อะไร

#### bank (Frontend)

- [ ] สร้างหน้า `src/app/cash-count/page.tsx`
- [ ] เพิ่มเมนู **นับเงินสด** ใน Sidebar (`NAV_ITEMS`)
- [ ] แสดงยอดคาดอัตโนมัติ (เรียก API)
- [ ] ฟอร์ม: เงินเปิดร้าน, นับจริง, หมายเหตุ
- [ ] แสดงผลขาด/เกิน สีแดง/เขียว
- [ ] ประวัติปิดยอดย้อนหลัง (list จาก `GET /api/cash-counts`)

**ทำไมสำคัญ:** ลูกค้าธุรกิจเงินสดหน้าร้าน — ต่างจาก Excel ธรรมดาชัดเจน

---

### 3. หมวดหมู่ต่อ API จริง

หน้า `/categories` ยังใช้ `lib/store` in-memory — เพิ่ม/ลบแล้วหายเมื่อ refresh

#### น็อต (Backend)

- [ ] สร้าง `src/app/api/categories/[id]/route.ts`
  - `PUT` — แก้ชื่อ, สี, sortOrder
  - `DELETE` — soft delete หรือลบจริง (ตกลงกับทีม)
- [ ] อัปเดต seed — หมวดหมู่ตามธุรกิจลูกค้า (ด้านล่าง)
- [ ] ตรวจ `POST /api/categories` รับ field ครบ

**หมวดหมู่ตัวอย่าง (seed)**

รายรับ: ค่าสินค้า, ค่าบริการจัดสวน, เงินสดหน้าร้าน, รายได้อื่น  
รายจ่าย: ค่าแรงงาน, ค่าขนส่ง, ค่าสินค้าซื้อเข้า, ค่าเบี้ยเลี้ยง, ค่าเช่า/น้ำ-ไฟ, อื่นๆ

#### bank (Frontend)

- [ ] แก้ `src/app/categories/page.tsx` — ลบ `lib/store` ใช้ `fetch('/api/categories')` แทน
- [ ] เพิ่มหมวด → `POST /api/categories`
- [ ] ลบหมวด → `DELETE /api/categories/[id]`
- [ ] เปลี่ยน placeholder จาก "เครื่องดื่ม" → "วัสดุก่อสร้าง" ฯลฯ
- [ ] Loading / error state

---

### 4. ตั้งค่าร้านบันทึกได้จริง

หน้า Settings ยังกดบันทึกแล้วไม่ save

#### น็อต (Backend)

- [ ] ตรวจ `GET/PUT /api/organizations` รองรับ field: `name`, `address`, `phone`, `receipt_config`, `hardware_config`
- [ ] map snake_case ↔ camelCase ถ้ายังไม่ครบ
- [ ] ทดสอบ PUT แล้ว GET กลับมาตรง

#### bank (Frontend)

- [ ] แก้ `src/app/settings/page.tsx` — โหลดข้อมูลร้านจาก `GET /api/organizations` ตอนเปิดหน้า
- [ ] ปุ่ม "บันทึกข้อมูลร้าน" → `PUT /api/organizations`
- [ ] แยก section ตั้งค่าใบเสร็จ (header/footer) ใน form เดียวกันหรือการ์ดแยก
- [ ] Toast บันทึกสำเร็จ

---

## P1 — สำคัญรอง (ทำให้ครบ workflow)

### 5. พิมพ์ใบเสร็จหลังบันทึก

```
บันทึกรายรับ → Preview ใบเสร็จ → พิมพ์ → (อนาคต) ลิ้นชักเด้ง
```

#### น็อต (Backend)

- [ ] สร้าง `src/lib/services/db/receipts.ts` — `generateReceiptNumber()`, `markAsPrinted()`
- [ ] `POST /api/receipts/[transactionId]/print` — ออกเลข `R-2026-0001`, อัปเดต `is_printed`
- [ ] `POST /api/hardware/print` — proxy ไป Local Bridge (รับ receipt payload)
- [ ] `POST /api/hardware/drawer` — คำสั่งเปิดลิ้นชัก (เตรียมไว้)

#### bank (Frontend)

- [ ] หลังบันทึกรายรับสำเร็จ → แสดง `ReceiptPreview` + ปุ่ม **พิมพ์**
- [ ] เรียก `POST /api/receipts/[id]/print` แล้วแสดงเลขที่ใบเสร็จ
- [ ] ปุ่มทดสอบพิมพ์ในหน้า Settings (เรียก hardware API)
- [ ] ลบข้อความ "(Mock)" ออกจาก `ReceiptPreview.tsx` เมื่อต่อ API แล้ว

#### Mark (Hardware — คนละสายกับ bank/น็อต)

- [ ] `src/lib/hardware/printer.ts` + `cashDrawer.ts` ต่อ Local Bridge จริง
- [ ] อัปเดต `docs/hardware-plan.md`

---

### 6. รายงานใช้งานได้

#### น็อต (Backend)

- [ ] `GET /api/reports/by-category?start=&end=` — สรุปแยกหมวด
- [ ] `GET /api/reports/daily-chart?days=30` — ข้อมูลกราฟ
- [ ] `GET /api/reports/export?format=csv` — ส่งออกไฟล์
- [ ] (optional) `GET /api/reports/dashboard` — รวม summary สำหรับหน้าแรก

#### bank (Frontend)

- [ ] หน้า `reports` — date picker (วันนี้ / เดือนนี้ / กำหนดเอง)
- [ ] ตารางรายงานแยกหมวดหมู่
- [ ] ปุ่ม **ส่งออก Excel/CSV**
- [ ] กราฟอัปเดตตามช่วงวันที่ที่เลือก

---

### 7. Login ต่อ Supabase จริง

ตอนนี้ PIN เก็บใน `localStorage` — เปลี่ยนเครื่องแล้วหาย

#### น็อต (Backend)

- [ ] เพิ่มคอลัมน์ `pin_hash` ในตาราง `users` (migration SQL)
- [ ] `POST /api/auth/login` — รับ username + PIN, ตรวจ hash, return session/token
- [ ] `GET /api/auth/me` — ข้อมูล user + organizationId
- [ ] `middleware.ts` — ป้องกัน API routes (optional รอบแรก)
- [ ] อัปเดต seed — hash PIN `0000` สำหรับ lcs / dev

#### bank (Frontend)

- [ ] แก้ `PinLogin.tsx` — เรียก `POST /api/auth/login` แทน localStorage
- [ ] เก็บ session จาก API (ไม่เก็บ PIN plain text)
- [ ] `AuthProvider` อ่าน `organizationId` จาก server session
- [ ] หน้า `set-password` — เรียก API ตั้ง PIN (แทน localStorage)
- [ ] ลบ hardcoded PIN ใน `kioskUsers.ts` เมื่อ auth จริงพร้อม (หรือเหลือแค่ dev fallback)

---

## P2 — ตอนมี hardware / ก่อน go-live

### 8. PWA + Tablet Kiosk

| คน | งาน |
|----|-----|
| **bank** | `manifest.json`, icons, meta tags, fullscreen UI polish บน tablet |
| **น็อต** | API รองรับ CORS / env production |
| **Mark** | Local Bridge service, ทดสอบ printer + RJ12 จริง |

---

### 9. Security ก่อน production

| คน | งาน |
|----|-----|
| **น็อต** | Supabase RLS policies จริง, ลบ "Allow all", rotate keys |
| **bank** | ไม่เก็บ secret ใน client, ลบ PIN จาก source code |
| **Mark** | Review security checklist ก่อน go-live |

---

### 10. Deploy

| คน | งาน |
|----|-----|
| **น็อต** | Supabase production, รัน schema + seed, env บน hosting |
| **bank** | Build ผ่าน CI, ทดสอบ UI บน staging URL |
| **Mark** | ประสาน UAT ลูกค้า 1 สัปดาห์, sign-off |

---

## Roadmap ตามสัปดาห์

| สัปดาห์ | น็อต (Backend) | bank (Frontend) |
|---------|----------------|-----------------|
| **1** | transactions `[id]` + void API | ปุ่มแก้/ยกเลิก + form แก้ |
| **1–2** | categories `[id]` CRUD | หน้า categories ต่อ API |
| **2** | organizations PUT ครบ + cash-counts/today | ตั้งค่าร้าน save จริง |
| **3** | reports by-category + export CSV | หน้านับเงินสด + รายงานกรองวันที่ |
| **4** | receipts + hardware proxy API | print flow + ReceiptPreview |
| **5+** | auth API + RLS + deploy DB | PWA + auth UI + staging test |

---

## สรุปงานทั้งหมด (checklist)

### น็อต (Backend)

- [ ] `PUT/GET /api/transactions/[id]`
- [ ] `POST /api/transactions/[id]/void`
- [ ] `PUT/DELETE /api/categories/[id]`
- [ ] `GET /api/cash-counts/today`
- [ ] `GET /api/reports/by-category`, `export`
- [ ] `POST /api/receipts/[id]/print`
- [ ] `POST /api/hardware/print`, `/drawer`
- [ ] `POST /api/auth/login`, `GET /api/auth/me`
- [ ] Zod validation ทุก POST/PUT
- [ ] RLS policies production
- [ ] อัปเดต `docs/backend-tasks.md` เมื่อเสร็จแต่ละ phase

### bank (Frontend)

- [ ] แก้/void UI ในรายรับ-รายจ่าย
- [ ] หน้า `/cash-count` + Sidebar menu
- [ ] หน้า `/categories` ต่อ API (ลบ lib/store)
- [ ] หน้า `/settings` บันทึก organization จริง
- [ ] รายงาน — date filter + export button
- [ ] Receipt print flow
- [ ] PinLogin ต่อ auth API
- [ ] PWA manifest + tablet UX
- [ ] อัปเดต `docs/frontend-tasks.md` เมื่อเสร็จแต่ละ phase

### Mark

- [ ] Review PR จาก bank และ น็อต
- [ ] Hardware / Local Bridge
- [ ] `docs/hardware-plan.md`, integration
- [ ] UAT + go-live decision

---

## ไม่ควรทำตอนนี้ (scope creep)

| ฟีเจอร์ | เหตุผล |
|---------|--------|
| สต็อกสินค้า / บาร์โค้ด | ไม่ใช่ POS ขาย |
| ตะกร้า / ใบกำกับภาษีเต็มรูปแบบ | เกิน MVP |
| Multi-branch | ลูกค้า MVP ร้านเดียว |
| ร้านกาแฟ / เมนูเครื่องดื่ม | ไม่ตรงธุรกิจลูกค้า |

---

## ถ้าเลือกทำแค่ 1 อย่างก่อน

**แนะนำ: ปิดยอดนับเงินสด**

- **น็อต** ทำ `cash-counts/today` + คำนวณ expected ก่อน (1–2 วัน)
- **bank** ทำหน้า UI ต่อ (2–3 วัน)

---

## เอกสารที่เกี่ยวข้อง

- `docs/frontend-tasks.md` — checklist ละเอียดฝั่ง bank
- `docs/backend-tasks.md` — checklist ละเอียดฝั่ง น็อต
- `docs/team-workflow.md` — วิธีทำงานทีม 3 คน
- `docs/hardware-plan.md` — printer + RJ12 + PWA (Mark)
- `docs/workflow.md` — flow การใช้งานหน้าร้าน
