# Frontend Tasks — งานที่ Frontend ควรทำ

> เอกสารสำหรับทีม Frontend Developer  
> โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย + ใบเสร็จ + เชื่อม POS / ลิ้นชัก  
> ลูกค้า: ธุรกิจวัสดุก่อสร้าง / อุปกรณ์ช่าง / จัดสวน  
> ผู้ใช้หลัก: 1 คน (เจ้าของ / พนักงานหน้าร้าน)

---

## เป้าหมาย Frontend

Web App ต้องรองรับ workflow หลัก:

```
เข้าระบบ → บันทึกรายรับ/รายจ่าย → บันทึก DB
         → (ถ้าเปิด) พิมพ์ใบเสร็จ → (ถ้าเปิด) ลิ้นชักเด้ง
         → ดูสรุปยอด → ปิดยอด / นับเงินสดประจำวัน
```

**สิ่งที่ระบบนี้คือ:** สมุดบัญชีดิจิทัล + ใบเสร็จหลักฐานรับ-จ่ายเงิน  
**สิ่งที่ระบบนี้ไม่ใช่:** POS ขายสินค้าเต็มรูปแบบ (ไม่มีสต็อก / ตะกร้า / บาร์โค้ด)

---

## สถานะ UI ปัจจุบัน

| ส่วน | สถานะ | หมายเหตุ |
|------|--------|----------|
| Layout (Sidebar, Header) | ✅ มี | ยังใช้ branding ร้านกาแฟ |
| Dashboard | ✅ placeholder | ใช้ mock data |
| รายรับ / รายจ่าย (list + add) | ✅ placeholder | ยังไม่เรียก API |
| หมวดหมู่ | ✅ placeholder | mock |
| รายงาน | ✅ placeholder | กราฟ hardcode |
| ตั้งค่า | ✅ placeholder | มี hardware mock |
| Login | ✅ mock | กดเข้าได้เลย |
| Receipt Preview | ✅ มี | ยังไม่เชื่อม flow พิมพ์จริง |
| ปิดยอด / นับเงินสด | ❌ ยังไม่มี | ต้องสร้างใหม่ |
| ตั้งค่าใบเสร็จ | ❌ ยังไม่มี | แยกจาก Settings ทั่วไป |
| เชื่อม API จริง | ❌ | ยัง import mock ตรงในหน้า |

---

## Phase 1 — ปรับ Branding และข้อมูลให้ตรงลูกค้า

### 1.1 เปลี่ยน Branding

**ไฟล์ที่เกี่ยวข้อง:**
- `src/constants/index.ts`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/app/login/page.tsx`

| เดิม | เปลี่ยนเป็น |
|------|-------------|
| `Coffee Shop POS` | ชื่อกิจการลูกค้า (หรือ "บัญชีร้าน") |
| `POS Income Expense` | `สมุดรายรับ-รายจ่าย` |
| Dashboard | **ภาพรวม** หรือ **หน้าหลัก** |

**สี / โทน:** เขียว (จัดสวน) + เทา/น้ำเงิน (วัสดุก่อสร้าง) — ดูเป็นมืออาชีพ ไม่ใช่ร้านกาแฟ

### 1.2 ปรับ Mock Categories

**ไฟล์:** `src/data/mock/categories.ts`

**รายรับ:**
- ค่าสินค้า (ขายวัสดุ / อุปกรณ์)
- ค่าบริการ (จัดสวน / ช่าง)
- เงินสดหน้าร้าน
- รายได้อื่น

**รายจ่าย:**
- ค่าแรงงาน
- ค่าขนส่ง
- ค่าสินค้า (ซื้อเข้า)
- ค่าเบี้ยเลี้ยง
- ค่าเช่า / ค่าน้ำ-ค่าไฟ
- ค่าใช้จ่ายอื่น

### 1.3 ปรับ Mock Transactions

**ไฟล์:** `src/data/mock/transactions.ts`

ใช้ตัวอย่างธุรกิจจริง เช่น:
- รับชำระค่าจัดสวนโครงการ X
- ขายปูน / อุปกรณ์ช่าง
- จ่ายค่าแรงทีมงาน
- ซื้อวัสดุจาก supplier
- ค่าขนส่ง

**ห้ามใส่ข้อมูลลูกค้าจริง** — ใช้ชื่อตัวอย่างทั่วไป

### 1.4 ปรับ Payment Methods

**ไฟล์:** `src/constants/index.ts`, `src/lib/validations/transaction.ts`

ให้ตรงกับ types / design doc:

| value | label |
|-------|-------|
| `cash` | เงินสด |
| `transfer` | โอนเงิน |
| `cheque` | เช็ค |
| `card` | บัตรเครดิต/เดบิต |
| `other` | อื่นๆ |

ลบ `qr` ออกถ้า types ไม่รองรับ

---

## Phase 2 — ฟอร์มบันทึกรายรับ/รายจ่าย (Core)

### 2.1 ปรับ TransactionForm

**ไฟล์:** `src/components/forms/TransactionForm.tsx`

**Fields ที่ต้องมี:**

| Field | บังคับ | หมายเหตุ |
|-------|--------|----------|
| ประเภท (income/expense) | ✅ | ส่งผ่าน prop หรือ hidden |
| วันที่รายการ (`transactionDate`) | ✅ | วันที่เกิดจริง ไม่ใช่แค่วันที่กดบันทึก |
| รายการ (`title`) | ✅ | เช่น "ขายปูนคุณสมชาย" |
| จำนวนเงิน (`amount`) | ✅ | ตัวเลขใหญ่ อ่านง่าย |
| หมวดหมู่ (`categoryId`) | ✅ | filter ตาม type |
| ช่องทางเงิน (`paymentMethod`) | ✅ | |
| เลขที่อ้างอิง (`referenceNo`) | ❌ | INV-xxx, เลขใบเสร็จ supplier |
| งาน / โครงการ (`projectName`) | ❌ | tag จัดกลุ่ม — ไม่ใช่ CRM |
| หมายเหตุ (`note`) | ❌ | |
| ☑ พิมพ์ใบเสร็จ | — | default: เปิดเมื่อ `paymentMethod = cash` + type = income |
| ☑ เปิดลิ้นชัก | — | default: เปิดเมื่อเงินสด + รายรับ |

**ปุ่มหลัก:**
- รายรับ: `บันทึก + พิมพ์ใบเสร็จ`
- รายจ่าย: `บันทึก` (ไม่พิมพ์ใบเสร็จโดย default)

**หลังบันทึกสำเร็จ:**
1. แสดง Toast สำเร็จ
2. แสดง Receipt Preview (ถ้าเลือกพิมพ์)
3. เรียก hardware API (Phase 5 — ตอนนี้ mock ได้)

### 2.2 Validation

**ไฟล์:** `src/lib/validations/transaction.ts`

อัปเดต schema ให้ครบ fields ใหม่ และตรง `PaymentMethod` ใน types

---

## Phase 3 — ใบเสร็จ (Receipt UI)

### 3.1 Receipt Preview

**ไฟล์:** `src/components/ReceiptPreview.tsx`, `src/receipt-templates/default-receipt.tsx`

**แสดงบนใบเสร็จ:**
- ชื่อกิจการ / ที่อยู่ / โทร
- เลขที่ใบเสร็จ (`receiptNo`) — format: `RCP-YYYY-NNNN`
- วันที่ + เวลา
- ประเภท: รายรับ / รายจ่าย
- รายการ, จำนวนเงิน
- ช่องทางชำระ
- หมายเหตุ (ถ้ามี)
- ข้อความท้ายใบ

**Actions:**
- ปุ่ม `พิมพ์ใบเสร็จ` → เรียก `/lib/hardware/printer` (mock ก่อน)
- ปุ่ม `เปิดลิ้นชัก` → เรียก `/lib/hardware/cashDrawer` (mock ก่อน)
- แสดงสถานะ: พิมพ์แล้ว / รอพิมพ์ / พิมพ์ไม่สำเร็จ

### 3.2 หน้าตั้งค่าใบเสร็จ

**Route ใหม่:** `/settings/receipt` หรือ section ใน `/settings`

| Field | คำอธิบาย |
|-------|----------|
| ชื่อกิจการ | หัวใบเสร็จ |
| ที่อยู่ | |
| เลขประจำตัวผู้เสียภาษี | |
| เบอร์โทร | |
| ข้อความท้ายใบ | เช่น "ขอบคุณที่อุดหนุน" |
| รูปแบบเลขที่ใบเสร็จ | prefix + running number |
| Preview ใบเสร็จ | แสดงตัวอย่าง real-time |

---

## Phase 4 — หน้ารายการ + Filter

### 4.1 รายรับ / รายจ่าย List

**ไฟล์:** `src/app/income/page.tsx`, `src/app/expense/page.tsx`

**เพิ่ม Filter:**
- ช่วงวันที่ (วันนี้ / สัปดาห์นี้ / เดือนนี้ / กำหนดเอง)
- หมวดหมู่
- ช่องทางชำระ (เงินสด / โอน / เช็ค)
- งาน / โครงการ
- สถานะ (ใช้งาน / ยกเลิก)

**ตารางแสดงคอลัมน์:**
- วันที่รายการ (`transactionDate`) — **ไม่ใช่** `createdAt`
- รายการ
- หมวดหมู่ (สี + ชื่อ)
- ช่องทาง
- เลขที่อ้างอิง
- จำนวนเงิน
- สถานะพิมพ์ (ไอคอน 🖨️)
- Actions: ดู / พิมพ์ซ้ำ / ยกเลิก

**คงไว้:** SearchBar, EmptyState ที่มีอยู่แล้ว

### 4.2 ลบ Receipt Preview ออกจาก list page

ย้ายไปแสดงเฉพาะหลังบันทึก หรือใน modal รายละเอียดรายการ — ไม่ควรแสดงตัวอย่างค้างท้ายหน้า list

---

## Phase 5 — Dashboard + รายงาน

### 5.1 Dashboard

**ไฟล์:** `src/app/dashboard/page.tsx`, `src/components/SummaryCards.tsx`

**Cards:**
| Card | ข้อมูล |
|------|--------|
| รายรับวันนี้ | sum income วันนี้ |
| รายจ่ายวันนี้ | sum expense วันนี้ |
| ยอดเงินควรเหลือ | เงินทอน + รายรับ − รายจ่าย (วันนี้) |
| กำไรสุทธิเดือนนี้ | รายรับ − รายจ่าย เดือนนี้ |

**ปุ่มลัด (คงไว้):**
- `+ เพิ่มรายรับ` (ปุ่มใหญ่ สีเขียว)
- `+ เพิ่มรายจ่าย` (ปุ่มใหญ่ สีแดง)

**เพิ่ม:**
- ลิงก์ `ปิดยอดวันนี้` → `/cash-count`
- กราฟรายรับ-รายจ่าย (คำนวณจากข้อมูลจริง ไม่ hardcode)
- กราฟรายจ่ายตามหมวด (Pie chart)
- รายการล่าสุด 5–10 รายการ

### 5.2 หน้ารายงาน

**ไฟล์:** `src/app/reports/page.tsx`

**เพิ่ม:**
- Date range picker (เริ่ม-สิ้นสุด)
- สรุปรายรับ / รายจ่าย / กำไรสุทธิ
- กราฟรายวัน (Bar chart)
- ตารางสรุปตามหมวดหมู่
- ปุ่ม `ส่งออก Excel` (เรียก API — UI ก่อน แล้ว mock)
- ปุ่ม `ส่งออก PDF` (Phase ถัดไป)

---

## Phase 6 — ปิดยอด / นับเงินสด (หน้าใหม่)

### 6.1 Route ใหม่

**Path:** `/cash-count`  
**เมนู Sidebar:** `นับเงินสด` หรือ `ปิดยอดประจำวัน`

### 6.2 UI หน้าปิดยอด

```
ยอดเงินทอน / ยอดยกมา     [ input ]
+ รายรับเงินสดวันนี้      [ auto จาก API ]
− รายจ่ายเงินสดวันนี้     [ auto จาก API ]
─────────────────────────
= ยอดเงินควรเหลือ         [ auto คำนวณ ]

ยอดเงินที่นับได้จริง *   [ input ]
─────────────────────────
= ผลต่าง                  [ auto ]
  สถานะ: สมดุล / ขาด / เกิน

หมายเหตุ                  [ textarea ]
[ บันทึกปิดยอด ]  [ พิมพ์สรุป ]
```

**สูตร (แสดงบน UI ให้ user เห็น):**
```
ยอดเงินทอน + รายรับ − รายจ่าย = ยอดเงินควรเหลือ
ยอดเงินควรเหลือ − ยอดเงินที่นับได้ = เงินขาด / เงินเกิน
```

### 6.3 ประวัติปิดยอด

- ตารางปิดยอดย้อนหลัง
- แสดงวันที่, ยอดควรเหลือ, ยอดนับได้, ผลต่าง, สถานะ

**Component ใหม่ที่แนะนำ:**
- `src/components/CashCountForm.tsx`
- `src/components/CashCountSummary.tsx`
- `src/app/cash-count/page.tsx`

---

## Phase 7 — ตั้งค่าอุปกรณ์ POS

### 7.1 หน้าตั้งค่า Hardware

**Path:** `/settings/hardware` หรือ section ใน `/settings`

| Field | คำอธิบาย |
|-------|----------|
| ประเภทเชื่อมต่อ | USB / LAN |
| IP + Port | สำหรับ LAN printer |
| สถานะการเชื่อมต่อ | ● เชื่อมต่อ / ○ ไม่พบ Bridge |
| ปุ่ม `ทดสอบพิมพ์` | ส่ง test receipt |
| ปุ่ม `ทดสอบลิ้นชัก` | ส่ง drawer kick |
| Toggle เปิดลิ้นชักอัตโนมัติ | เมื่อบันทึกรายรับเงินสด |

**หมายเหตุบน UI:**
> การเชื่อมต่อจริงต้องมี Local Bridge รันบนเครื่อง POS (Windows)  
> ดูรายละเอียดใน `docs/hardware-plan.md`

**ลบออกจาก UI หลัก (หรือย้ายไป dev-only):**
- Database Provider selector — ไม่จำเป็นสำหรับ end user

---

## Phase 8 — เชื่อม API จริง

### 8.1 แทนที่ Mock Data

**ทุกหน้าที่ import จาก `@/data/mock` ต้องเปลี่ยนเป็น:**

```typescript
// Server Component
const res = await fetch(`${baseUrl}/api/transactions?type=income`);
const { data } = await res.json();

// Client Component
const res = await fetch("/api/transactions", { method: "POST", body: ... });
```

**หน้าที่ต้องเชื่อม:**

| หน้า | API |
|------|-----|
| Dashboard | `GET /api/reports/summary`, `GET /api/transactions` |
| รายรับ / รายจ่าย | `GET /api/transactions?type=...` |
| เพิ่มรายการ | `POST /api/transactions` |
| หมวดหมู่ | `GET/POST /api/categories` |
| รายงาน | `GET /api/reports/summary?start=&end=` |
| ตั้งค่า | `GET/PUT /api/organizations` |
| ปิดยอด | `GET/POST /api/cash-counts` |

### 8.2 Loading / Error States

ทุกหน้าที่เรียก API ต้องมี:
- Skeleton หรือ Spinner ตอนโหลด
- Empty state เมื่อไม่มีข้อมูล
- Error message เมื่อ API ล้มเหลว
- Toast เมื่อบันทึกสำเร็จ / ล้มเหลว

### 8.3 Custom Hooks (แนะนำ)

```
src/hooks/
  useTransactions.ts
  useCategories.ts
  useReportSummary.ts
  useCashCounts.ts
  useOrganization.ts
```

---

## Phase 9 — Responsive + UX สำหรับหน้าร้าน

### 9.1 Breakpoints

| อุปกรณ์ | การใช้งาน |
|---------|-----------|
| PC / POS All-in-One | หน้าร้านหลัก — ปุ่มใหญ่ ฟอร์มเต็มจอ |
| แท็บเล็ต | ดูรายงาน / ปิดยอด |
| มือถือ | บันทึกรายการหน้างาน (จัดสวน) |

### 9.2 UX หน้าร้าน

- ปุ่มบันทึกสูงอย่างน้อย 48px (touch target)
- ตัวเลขจำนวนเงินขนาดใหญ่ (อ่านได้จากระยะ 1 เมตร)
- ฟอร์มบันทึกรายรับ: เปิดมาแล้ว focus ที่ช่องจำนวนเงินทันที
- หลังบันทึกสำเร็จ: reset form พร้อมบันทึกรายการถัดไป
- Keyboard: Enter = บันทึก, Esc = ยกเลิก

### 9.3 Sidebar บนมือถือ

คง hamburger menu ที่มีอยู่ — ตรวจสอบว่าเมนูใหม่ (`นับเงินสด`) แสดงบน mobile ด้วย

---

## เมนู Sidebar สุดท้าย (เป้าหมาย)

```
📊 ภาพรวม           /dashboard
💰 รายรับ            /income
💸 รายจ่าย           /expense
🏷️ หมวดหมู่          /categories
📈 รายงาน            /reports
💵 ปิดยอด / นับเงินสด /cash-count      ← ใหม่
⚙️ ตั้งค่า           /settings
   ├─ ข้อมูลกิจการ
   ├─ ใบเสร็จ         /settings/receipt  ← ใหม่
   └─ อุปกรณ์ POS     /settings/hardware ← ใหม่
```

**อัปเดต:** `src/constants/index.ts` → `NAV_ITEMS`

---

## Components ที่ต้องสร้าง / ปรับ

| Component | Action | Path |
|-----------|--------|------|
| `TransactionForm` | ปรับ fields + toggle พิมพ์/ลิ้นชัก | `src/components/forms/` |
| `ReceiptPreview` | ปรับ layout 80mm + ปุ่มพิมพ์ | `src/components/` |
| `DefaultReceiptTemplate` | ปรับข้อมูลกิจการ | `src/receipt-templates/` |
| `TransactionTable` | แสดง `transactionDate`, สถานะพิมพ์ | `src/components/tables/` |
| `CashCountForm` | สร้างใหม่ | `src/components/forms/` |
| `CashCountSummary` | สร้างใหม่ | `src/components/` |
| `DateRangePicker` | สร้างใหม่ | `src/components/ui/` |
| `CategoryBreakdownChart` | สร้างใหม่ (Pie) | `src/components/charts/` |
| `HardwareStatus` | สร้างใหม่ | `src/components/` |
| `ReceiptSettingsForm` | สร้างใหม่ | `src/components/forms/` |

---

## สิ่งที่ Frontend ไม่ต้องทำ

| ไม่ทำ | เหตุผล |
|-------|--------|
| ระบบสินค้า / สต็อก | นอก scope |
| ตะกร้า / บาร์โค้ด | นอก scope |
| CRM ลูกค้า | มีแค่ชื่องาน/โครงการเป็นข้อความ |
| Local Bridge service | งาน Hardware / Mark |
| Firestore / Supabase setup | งาน Backend |
| Security Rules | งาน Backend |

---

## Definition of Done (Frontend)

แต่ละ task ถือว่าเสร็จเมื่อ:

- [ ] เปิดหน้าได้ไม่มี error (`npm run build` ผ่าน)
- [ ] Responsive บน mobile + desktop
- [ ] มี loading / empty / error state
- [ ] ใช้ TypeScript types จาก `src/types/index.ts`
- [ ] ไม่ hardcode ข้อมูลลูกค้าจริง
- [ ] ผ่าน `npm run lint`
- [ ] PR มี screenshot หน้าจอที่เปลี่ยน

---

## ลำดับทำงานแนะนำ (สรุป)

```
Week 1: Phase 1 + 2  (branding, หมวดหมู่, ฟอร์ม)
Week 2: Phase 3 + 4  (ใบเสร็จ, filter รายการ)
Week 3: Phase 5 + 6  (dashboard, รายงาน, ปิดยอด)
Week 4: Phase 7 + 8  (ตั้งค่า hardware, เชื่อม API)
Week 5: Phase 9      (responsive polish, ทดสอบหน้าร้าน)
```

---

## เอกสารอ้างอิง

- `docs/scope.md` — ขอบเขต MVP
- `docs/workflow.md` — user flow
- `docs/hardware-plan.md` — แผน printer / cash drawer
- `docs/database-design.md` — schema และ fields
- `docs/team-workflow.md` — แบ่งงานทีม
- `pos_workflow_tech_stack_plan.pdf` — workflow + tech stack จากลูกค้า

---

## Branch / Commit

```
Branch:  feature/frontend-<task-name>

Commit:
  [Frontend] update branding for construction business
  [Frontend] add receipt print toggle to transaction form
  [Frontend] create cash count closing page
  [Frontend] connect income list to API
```
