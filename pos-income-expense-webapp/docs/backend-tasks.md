# Backend Tasks — งานที่ Backend ควรทำ

> เอกสารสำหรับทีม Backend Developer
> โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย + ใบเสร็จ + เชื่อม POS / ลิ้นชัก
> ลูกค้า: ธุรกิจวัสดุก่อสร้าง / อุปกรณ์ช่าง / จัดสวน
> ผู้ใช้หลัก: 1 คน (MVP single-tenant)

---

## สถานะ Backend ปัจจุบัน (อัปเดทล่าสุด)

| ส่วน | สถานะ | หมายเหตุ |
|------|--------|----------|
| Tech Stack | ✅ **Supabase (PostgreSQL)** | เปลี่ยนจาก Firebase แล้ว |
| Types (`src/types/index.ts`) | ✅ ครบ | `transactionDate`, `status`, `organizationId`, `receiptNo`, `isPrinted`, `voidReason`, `voidedAt`, `voidedBy` ฯลฯ |
| In-memory store (`lib/store`) | ⚠️ ยังอยู่ | Frontend ยังใช้ — ต้องแทนที่ด้วย API ในภายหลัง |
| Supabase client (`lib/db/supabase.ts`) | ✅ init จริง | `createClient()` + อ่าน `NEXT_PUBLIC_SUPABASE_*` จาก `.env.local` |
| DB Provider (`lib/db/index.ts`) | ✅ "supabase" | `DB_PROVIDER = "supabase"` |
| API `/api/transactions` | ✅ GET/POST | รองรับ `type`, `startDate`, `endDate`, `status` query |
| API `/api/transactions/[id]` | ✅ มีแล้ว | GET, PUT, `/void` (ไม่มี DELETE — ใช้ void แทน) |
| API `/api/categories` | ✅ GET/POST | `/api/categories/route.ts` |
| API `/api/categories/[id]` | ✅ มีแล้ว | PUT, DELETE |
| API `/api/organizations` | ✅ GET/PUT | `/api/organizations/route.ts` |
| API `/api/users` | ✅ GET | `/api/users/route.ts` |
| API `/api/cash-counts` | ✅ GET/POST | `/api/cash-counts/route.ts` + คำนวณ `expectedBalance` real-time |
| API `/api/cash-counts/today` | ✅ มีแล้ว | ดึงยอดวันนี้ + คำนวณ expected |
| API `/api/reports/summary` | ✅ GET | รองรับ `start`, `end` query params |
| API `/api/reports/dashboard` | ✅ มีแล้ว | `GET` — today/month summary + expectedCashBalance |
| API `/api/reports/by-category` | ✅ มีแล้ว | `GET` — กลุ่มตาม category + total + count |
| API `/api/reports/daily-chart` | ✅ มีแล้ว | `GET?days=30` — income/expense ต่อวัน |
| API `/api/reports/export` | ✅ มีแล้ว | `GET` — CSV download, UTF-8 + BOM |
| API `/api/receipts/[id]/print` | ❌ ยังไม่มี | ต้องสร้าง |
| API `/api/hardware/print` | ❌ ยังไม่มี | Proxy → Local Bridge |
| API `/api/hardware/drawer` | ❌ ยังไม่มี | เปิดลิ้นชัก |
| Validation (Zod) | ✅ ครบแล้ว | validate ใน `POST /transactions`, `PUT /transactions/[id]`, `POST/PUT /categories` |
| Auth | ✅ มีแล้ว | `POST /api/auth/login`, `GET /api/auth/me` (MVP kiosk-based) |
| Seed script | ✅ รันสำเร็จ | `npx tsx src/scripts/seed.ts` — ข้อมูลเข้า Supabase จริง |
| Export CSV/Excel | ✅ มีแล้ว | `GET /api/reports/export` — CSV download |
| `.gitignore` | ✅ อัปเดทแล้ว | Ignore `.env*` (ไม่มี exception) |
| Row Level Security | ⚠️ มี SQL แต่เปิด "Allow all" | ต้องปรับ policies จริงตอน production |
| Frontend compatibility | ✅ คง `Receipt` type ไว้ | UI ไม่พัง |
| Build + Lint | ✅ ผ่าน | `npm run build` ✅ / `npm run lint` ⚠️ (มี error จากฝั่ง Frontend ไม่ใช่ Backend) |
| Git Branch | ✅ `feature/backend-supabase` | Pushed รอ PR review |

---

## โครงสร้างโฟลเดอร์ปัจจุบัน

```
src/
├── app/api/
│   ├── transactions/
│   │   └── route.ts              # GET list, POST create
│   │   # [id]/route.ts (GET, PUT) ✅
│   │   # [id]/void/route.ts (POST) ✅
│   ├── categories/
│   │   └── route.ts              # GET list, POST create
│   │   # [id]/route.ts (PUT, DELETE) ✅
│   ├── organizations/
│   │   └── route.ts              # GET, PUT
│   ├── users/
│   │   └── route.ts              # GET
│   ├── cash-counts/
│   │   └── route.ts              # GET list, POST create
│   │   # TODO: [id]/route.ts
│   │   # today/route.ts ✅
│   ├── reports/
│   │   └── summary/route.ts      # GET (start, end)
│   │   # dashboard/route.ts ✅
│   │   # by-category/route.ts ✅
│   │   # daily-chart/route.ts ✅
│   │   # export/route.ts (CSV) ✅
│   └── # TODO: receipts/[transactionId]/print/route.ts
│   └── # TODO: hardware/print/route.ts
│   └── # TODO: hardware/drawer/route.ts
├── lib/
│   ├── db/
│   │   ├── index.ts              # DB_PROVIDER = "supabase"
│   │   ├── supabase.ts           # createClient() — init จริง
│   │   └── postgres.ts           # (ไม่ใช้)
│   ├── services/db/              # business logic
│   │   ├── index.ts
│   │   ├── transactions.ts       # ✅ getTransactions, createTransaction
│   │   ├── categories.ts         # ✅ getCategories, createCategory
│   │   ├── organizations.ts      # ✅ getOrganization, updateOrganization
│   │   ├── users.ts              # ✅ getUsers
│   │   ├── cashCounts.ts         # ✅ getCashCounts, createCashCount, calculateExpectedBalance
│   │   └── reports.ts ✅ (getDashboard, getByCategory, getDailyChart)
│   │   └── # TODO: receipts.ts (รอ hardware)
│   ├── validations/
│   │   └── transaction.ts        # ✅ เชื่อมกับ API routes แล้ว (POST /transactions, PUT /transactions/[id], POST/PUT /categories)
│   └── utils/
│       └── # TODO: receiptNumber.ts (รอ receipts)
│       └── apiError.ts ✅
│   └── store/                    # ⚠️ ยังอยู่ — Frontend ยังใช้
│       └── categories.ts
│       └── index.ts
├── types/index.ts                # ✅ ครบทุก type
├── scripts/
│   └── seed.ts                   # ✅ รันสำเร็จ + dotenv โหลด .env.local
└── data/mock/                    # ✅ คงไว้สำหรับ dev/test
docs/
├── database-design.md            # 🧠 ความจำกลาง (Central Memory)
├── supabase-schema.sql           # ✅ SQL Schema 5 tables + constraints + index + RLS
└── backend-tasks.md              # เอกสารนี้
```

---

## Phase 1 — Schema + Types + Env ✅ เสร็จแล้ว

### 1.1 Types (`src/types/index.ts`) ✅

- [x] `Transaction` — มี `organizationId`, `transactionDate`, `status`, `voidReason`, `voidedAt`, `voidedBy`, `receiptNo`, `isPrinted`, `createdBy`, `updatedBy`, `updatedAt`
- [x] `Category` — มี `organizationId`, `sortOrder`, `isActive`, `createdAt`
- [x] `Organization` — มี `receiptConfig`, `hardwareConfig`, `createdAt`
- [x] `CashCount` — มี `openingBalance`, `expectedBalance`, `actualBalance`, `variance`, `status`
- [x] `PaymentMethod` — `"cash" | "transfer" | "cheque" | "card" | "other"`
- [x] `User` — มี `organizationId`, `role`, `isActive`

### 1.2 SQL Schema (`docs/supabase-schema.sql`) ✅

- [x] 5 tables: `organizations`, `users`, `categories`, `transactions`, `cash_counts`
- [x] Constraints: `amount > 0`, `type IN ('income','expense')`, `status IN ('active','void')`, `payment_method IN ('cash','transfer','cheque','card','other')`, `UNIQUE(organization_id, type, name)` บน categories
- [x] Indexes: `idx_txn_org_date`, `idx_txn_org_type_date`, `idx_txn_category`, `idx_txn_org_status`, `idx_cc_org_date`
- [x] RLS policies (MVP: `Allow all` ก่อน)

### 1.3 Environment ✅

- [x] `.env.local` — ใส่ key จริง (ignored by git, ไม่ถูก push)
- [x] `.gitignore` — ignore `.env*` (ไม่มี exception)
- [x] `dotenv` — seed script โหลด `.env.local` อัตโนมัติ

---

## Phase 2 — Supabase Client + Services ✅ เสร็จแล้ว

### 2.1 Dependencies ✅

- [x] `@supabase/supabase-js`
- [x] `dotenv` (สำหรับ seed script)

### 2.2 Supabase Client (`src/lib/db/supabase.ts`) ✅

- [x] `createClient()` — อ่าน env vars จาก `.env.local`
- [x] `getDb()` — return Supabase client singleton

### 2.3 Services (`src/lib/services/db/`) ✅

| Service | Functions | สถานะ |
|---------|-----------|--------|
| `transactions.ts` | `getTransactions`, `createTransaction` | ✅ |
| `categories.ts` | `getCategories`, `createCategory` | ✅ |
| `organizations.ts` | `getOrganization`, `updateOrganization` | ✅ |
| `users.ts` | `getUsers` | ✅ |
| `cashCounts.ts` | `getCashCounts`, `createCashCount`, `calculateExpectedBalance` | ✅ |
| `reports.ts` | `getSummary`, `getByCategory`, `getDailyChart` | ❌ |
| `receipts.ts` | `generateReceiptNumber`, `markAsPrinted` | ❌ |

---

## Phase 3 — API Transactions (CRUD + Void) ⚠️ ครึ่งหนึ่ง

### 3.1 `GET /api/transactions` ✅

- [x] Query: `type`, `status`, `startDate`, `endDate`, `categoryId`, `paymentMethod`, `search`
- [x] Filter ตาม `transaction_date` DESC
- [x] Response: `{ data: Transaction[], total: number }`

### 3.2 `POST /api/transactions` ✅

- [x] Body: type, categoryId, title, amount, transactionDate, paymentMethod, referenceNo, note
- [x] Logic: สร้าง `status: active`, `createdBy`

### 3.3 `GET /api/transactions/[id]` ✅

- [x] ดึงรายการเดียว พร้อม category name (join)

### 3.4 `PUT /api/transactions/[id]` ✅

- [x] แก้ไขรายการที่ `status = active` เท่านั้น (ห้ามแก้ถ้า `status = void`)
- [x] รับ fields ที่แก้ได้: `title`, `amount`, `categoryId`, `paymentMethod`, `transactionDate`, `note`, `referenceNo`
- [x] บันทึก `updatedBy`, `updatedAt` (DB: `updated_by`, `updated_at`)
- [x] Map snake_case ↔ camelCase ใน `src/lib/services/db/transactions.ts`

### 3.5 `DELETE /api/transactions/[id]` ❌

> **ไม่รองรับ hard delete** — DB Schema (`database-design.md`) ไม่มี `is_active` / `deleted_at` บน `transactions`
> ใช้ `POST /api/transactions/[id]/void` แทน (ยกเลิกรายการ เก็บประวัติไว้ตรวจสอบ)

### 3.6 `POST /api/transactions/[id]/void` ✅

- [x] ยกเลิกรายการ (ไม่ลบ):
```json
{ "voidReason": "จดซ้ำ", "voidedBy": "user-1" }
```
- [x] ตั้ง `status: void`, `voidedAt`, `voidedBy`, `voidReason` (DB: `status`, `voided_at`, `voided_by`, `void_reason`)

### 3.7 Validation ✅

- [x] อัปเดต Zod schema (`src/lib/validations/transaction.ts`) ให้ครบ field
- [x] เชื่อม Zod validation เข้ากับ API routes (POST /transactions, PUT /transactions/[id], POST/PUT /categories)

---

## Phase 4 — API Categories + Organizations ✅ เสร็จแล้ว

### 4.1 Categories ✅

| Method | Endpoint | สถานะ |
|--------|----------|--------|
| GET | `/api/categories` | ✅ |
| POST | `/api/categories` | ✅ |
| PUT | `/api/categories/[id]` | ✅ |
| DELETE | `/api/categories/[id]` | ✅ |

### 4.2 Organizations ✅

| Method | Endpoint | สถานะ |
|--------|----------|--------|
| GET | `/api/organizations` | ✅ |
| PUT | `/api/organizations` | ✅ |

---

## Phase 5 — API Reports + Dashboard ✅ เสร็จแล้ว

### 5.1 `GET /api/reports/summary` ✅

- [x] Query: `start`, `end`
- [x] คำนวณจาก `transactions WHERE status = active`

### 5.2 `GET /api/reports/dashboard` ✅

- [x] สรุป: `todayIncome`, `todayExpense`, `monthIncome`, `monthExpense`, `netProfit`, `expectedCashBalance`

### 5.3 `GET /api/reports/by-category` ✅

- [x] กลุ่มตาม category + คำนวณ total

### 5.4 `GET /api/reports/daily-chart` ✅

- [x] GROUP BY `transaction_date`

### 5.5 `GET /api/reports/export` ✅

- [x] Query: `format=csv`
- [x] ส่งไฟล์ดาวน์โหลด

---

## Phase 6 — Cash Count ✅ เสร็จแล้ว

### 6.1 สูตร ✅

```
expectedBalance = openingBalance + cashIncome - cashExpense
variance = actualBalance - expectedBalance
status = balanced (0) | short (<0) | overage (>0)
```

> **หมายเหตุ DB:** ชื่อ columns ใน Supabase เป็น `snake_case` (`opening_balance`, `expected_balance`, `actual_balance`, `variance`, `counted_by`) ต้อง map ให้ตรงใน service layer

### 6.2 API ✅

| Method | Endpoint | สถานะ |
|--------|----------|--------|
| GET | `/api/cash-counts` | ✅ |
| POST | `/api/cash-counts` | ✅ |
| GET | `/api/cash-counts/today` | ✅ |

---

## Phase 7 — Receipt + Hardware API ❌ ยังไม่ทำ

### 7.1 เลขที่ใบเสร็จ ❌

- [ ] `src/lib/utils/receiptNumber.ts` — Format: `RCP-YYYY-NNNN`
- [ ] Counter ต่อปี ต่อ organization

### 7.2 `POST /api/receipts/[transactionId]/print` ❌

- [ ] ดึง transaction + org receipt_config
- [ ] สร้าง/คืน `receiptNo`
- [ ] ส่ง payload ไป Local Bridge
- [ ] `isPrinted = true`, `printedAt = now()`

### 7.3 Hardware Proxy ❌

- [ ] `POST /api/hardware/print` — proxy → Local Bridge
- [ ] `POST /api/hardware/drawer` — เปิดลิ้นชัก

---

## Phase 8 — Auth ✅ (MVP) เสร็จแล้ว

### 8.1 Supabase Auth ❌

| Method | Endpoint | สถานะ |
|--------|----------|--------|
| POST | `/api/auth/login` | ✅ |
| POST | `/api/auth/logout` | ⏳ |
| GET | `/api/auth/me` | ✅ |

### 8.2 Middleware ⏳

- [ ] `src/middleware.ts` — protect routes (รอ go-live)

### 8.3 Row Level Security ⚠️

- [x] SQL Policies มีแล้ว (MVP: `Allow all`)
- [ ] ปรับเป็น policies จริงตอน production

---

## Phase 9 — Seed + Dev Tools ✅ เสร็จแล้ว

### 9.1 Seed Script ✅

- [x] `src/scripts/seed.ts`
- [x] รัน: `npx tsx src/scripts/seed.ts`
- [x] ใช้ `dotenv` โหลด `.env.local` อัตโนมัติ
- [x] Seed สำเร็จ: 1 org, 1 user, 7 categories, 8 transactions

### 9.2 npm Scripts ✅

- [x] เพิ่ม `db:seed` ใน `package.json`:
  ```json
  "db:seed": "tsx src/scripts/seed.ts"
  ```
  - ติดตั้ง `tsx` เป็น devDependency
  - รันได้ด้วย `npm run db:seed`
- [ ] (Optional) `db:migrate`: `supabase db push` (รอ go-live)

---

## Phase 10 — Error Handling + API Standards ✅ เสร็จแล้ว

### 10.1 Response Format ✅

ต้องมาตรฐานเป็น:
```json
{ "data": { ... }, "total": 10 }
// หรือ
{ "error": { "code": "...", "message": "..." } }
```

### 10.2 API Error Utility ✅

- [x] `src/lib/utils/apiError.ts` — `apiError()`, `apiSuccess()`, `apiSuccessList()`

---

## สรุปสิ่งที่ต้องทำต่อ (Priority)

| Priority | งาน | ไฟล์/Endpoint |
|----------|------|-------------|
| ✅ | Transaction [id] endpoints | `/api/transactions/[id]/route.ts` (GET, PUT), `/api/transactions/[id]/void/route.ts` |
| ✅ | Category [id] endpoints | `/api/categories/[id]/route.ts` (PUT, DELETE) |
| ✅ | Dashboard API | `/api/reports/dashboard`, `/api/reports/by-category`, `/api/reports/daily-chart` |
| ✅ | Export API | `/api/reports/export` (CSV) |
| ✅ | Cash count today | `/api/cash-counts/today` |
| 🟢 P2 | Receipt print | `/api/receipts/[id]/print` |
| 🟢 P2 | Hardware proxy | `/api/hardware/print`, `/api/hardware/drawer` |
| ✅ | Auth (MVP) | `/api/auth/login`, `/api/auth/me` |
| ✅ | Validation | เชื่อม Zod เข้า API routes |
| ✅ | npm scripts | `db:seed` |
| ✅ | Error handling | `src/lib/utils/apiError.ts` |

---

## 🚫 ข้อจำกัดของ Devin (ห้ามยุ่งเกี่ยว)

> **กฎเหล็ก:** Devin **ห้าม** เข้าถึง แก้ไข หรือยุ่งเกี่ยวกับสิ่งต่อไปนี้โดยเด็ดขาด

| สิ่งที่ห้าม | เหตุผล |
|-------------|--------|
| `.env.local` | เก็บ Supabase API Key / credentials จริง — ข้อมูลลับ |
| `.env` ใดๆ | เก็บ secrets, passwords, tokens |
| Supabase Dashboard / Project Settings | ไม่มีสิทธิ์เข้าถึง console จริง |
| API Keys / Service Role Key / JWT | ข้อมูล sensitive |
| ไฟล์ credentials ใดๆ | SSH keys, database passwords |
| Firebase / Google Cloud Console | ไม่ใช่ส่วนที่มีสิทธิ์จัดการ |

**สิ่งที่ Devin ทำได้แทน:**
- เขียน `.env.example` (template ไม่มีค่าจริง) ✅
- แนะนำขั้นตอนว่าต้องไปเอา key จากไหน ✅
- เขียนโค้ดที่อ่านค่าจาก `process.env` ✅
- อ่าน/แก้ไขโค้ดทั่วไปที่ไม่มีข้อมูลลับ ✅
