# Backend Tasks — งานที่ Backend ควรทำ

> เอกสารสำหรับทีม Backend Developer  
> โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย + ใบเสร็จ + เชื่อม POS / ลิ้นชัก  
> ลูกค้า: ธุรกิจวัสดุก่อสร้าง / อุปกรณ์ช่าง / จัดสวน  
> ผู้ใช้หลัก: 1 คน (MVP single-tenant)

---

## เป้าหมาย Backend

รองรับ workflow หลักจากลูกค้า:

```
API รับรายการ → บันทึก DB → สร้างเลขที่ใบเสร็จ
              → คำนวณสรุปยอด / รายงาน
              → ปิดยอดเงินสด (cash count)
              → (ส่งต่อ) คำสั่งพิมพ์ / ลิ้นชัก ผ่าน Local Bridge
```

**Database แนะนำ:** **Supabase (PostgreSQL)** — เหมาะกับข้อมูล relational, รายงาน SQL, Auth, Storage แนบสลิป  
**ทางเลือก:** Firebase Firestore (มีตัวอย่างใน `pos_v1` แล้ว) — ใช้ได้ถ้าทีมคุ้นเคย แต่รายงานซับซ้อนกว่า

---

## สถานะ Backend ปัจจุบัน

| ส่วน | สถานะ | หมายเหตุ |
|------|--------|----------|
| Types (`src/types/index.ts`) | ⚠️ ขาด fields | ยังไม่มี `transactionDate`, `status`, `organizationId` ฯลฯ |
| In-memory store (`lib/store`) | ✅ mock | API ใช้อยู่ — ต้องแทนที่ด้วย DB |
| API `/api/transactions` | ✅ GET/POST | ยังไม่มี PUT/DELETE/void |
| API `/api/categories` | ✅ GET/POST | ยังไม่มี PUT/DELETE |
| API `/api/reports/summary` | ✅ GET | คำนวณจาก `createdAt` — ต้องใช้ `transactionDate` |
| API organizations / users | ❌ | ยังไม่มี |
| API cash-counts | ❌ | ยังไม่มี |
| API receipts / print | ❌ | ยังไม่มี |
| Supabase client | ❌ placeholder | `lib/db/supabase.ts` |
| Validation (Zod) | ⚠️ ไม่ครบ | `paymentMethod` ไม่ตรง types |
| Auth | ❌ | ยังไม่มี |
| Seed script | ❌ | ยังไม่มี |
| Export CSV/Excel | ❌ | ยังไม่มี |

---

## โครงสร้างโฟลเดอร์เป้าหมาย

```
src/
├── app/api/
│   ├── transactions/
│   │   ├── route.ts              # GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts          # GET, PUT, DELETE
│   │       └── void/route.ts     # POST void
│   ├── categories/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── organizations/route.ts
│   ├── users/route.ts
│   ├── cash-counts/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── reports/
│   │   ├── summary/route.ts
│   │   ├── by-category/route.ts
│   │   └── export/route.ts       # CSV / Excel
│   ├── receipts/
│   │   └── [transactionId]/print/route.ts
│   └── hardware/
│       ├── print/route.ts        # proxy → Local Bridge
│       └── drawer/route.ts
├── lib/
│   ├── db/
│   │   ├── index.ts              # DB_PROVIDER
│   │   └── supabase.ts           # client init
│   ├── services/                 # business logic
│   │   ├── transactions.ts
│   │   ├── categories.ts
│   │   ├── organizations.ts
│   │   ├── users.ts
│   │   ├── cashCounts.ts
│   │   ├── reports.ts
│   │   └── receipts.ts
│   ├── validations/
│   │   ├── transaction.ts
│   │   ├── category.ts
│   │   └── cashCount.ts
│   └── utils/
│       ├── receiptNumber.ts      # RCP-YYYY-NNNN
│       └── apiError.ts           # standardized errors
├── types/index.ts
└── scripts/
    └── seed.ts
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

**ลบหรือ deprecate หลังเชื่อม DB:**
- `src/lib/store/*` — in-memory store เก่า

---

## Phase 1 — ออกแบบ Schema + Types

### 1.1 อัปเดต Types

**ไฟล์:** `src/types/index.ts`

ให้ตรง `docs/database-design.md`:

```typescript
// Transaction — fields สำคัญที่ต้องเพิ่ม
organizationId: string;
transactionDate: string;      // YYYY-MM-DD — ใช้รายงาน
referenceNo?: string;
projectName?: string;         // ชื่องาน/โครงการ (optional)
status: "active" | "void";
voidReason?: string;
voidedAt?: string;
voidedBy?: string;
receiptNo?: string;           // RCP-2026-0001
isPrinted: boolean;
createdBy: string;
updatedBy?: string;
updatedAt?: string;

// PaymentMethod — เปลี่ยนเป็น
"cash" | "transfer" | "cheque" | "card" | "other"

// Category — เพิ่ม
organizationId, sortOrder, isActive, createdAt

// Organization — สร้างใหม่
receiptConfig?, hardwareConfig?

// CashCount — สร้างใหม่
openingBalance, expectedBalance, actualBalance, variance, status
```

### 1.2 Supabase Migration

**ไฟล์:** `supabase/migrations/001_initial_schema.sql`

**Tables MVP:**

| Table | ความสำคัญ |
|-------|-----------|
| `organizations` | ข้อมูลกิจการ + receipt_config + hardware_config (JSONB) |
| `categories` | หมวดรายรับ/รายจ่าย |
| `transactions` | หัวใจระบบ |
| `cash_counts` | ปิดยอด / นับเงินสด |
| `users` / `profiles` | ผู้ใช้ (เชื่อม Supabase Auth) |

**Indexes สำหรับรายงาน:**

```sql
CREATE INDEX idx_txn_org_date ON transactions (organization_id, transaction_date);
CREATE INDEX idx_txn_org_type_date ON transactions (organization_id, type, transaction_date);
CREATE INDEX idx_txn_category ON transactions (category_id);
CREATE INDEX idx_txn_status ON transactions (organization_id, status);
CREATE INDEX idx_cash_count_date ON cash_counts (organization_id, count_date);
```

**Constraints:**
- `amount > 0`
- `type IN ('income', 'expense')`
- `status IN ('active', 'void')`
- `payment_method IN ('cash','transfer','cheque','card','other')`
- UNIQUE `(organization_id, type, name)` บน categories

### 1.3 Environment Variables

**ไฟล์:** `.env.example` (สร้างใหม่)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only สำหรับ seed/admin
DEFAULT_ORG_ID=default-org        # MVP single tenant
```

---

## Phase 2 — Supabase Client + Services Layer

### 2.1 ติดตั้ง Dependencies

```bash
npm install @supabase/supabase-js
npm install uuid                    # ถ้ายังไม่มี
```

### 2.2 Supabase Client

**ไฟล์:** `src/lib/db/supabase.ts`

- `createClient()` สำหรับ browser (anon key)
- `createServerClient()` สำหรับ API routes (service role หรือ cookie-based)
- อัปเดต `DB_PROVIDER = "supabase"` ใน `lib/db/index.ts`

### 2.3 Services (แยกจาก API routes)

**หลักการ:** API route = thin layer (validate → call service → respond)

| Service | Functions |
|---------|-----------|
| `transactions.ts` | `getTransactions`, `getTransaction`, `createTransaction`, `updateTransaction`, `voidTransaction` |
| `categories.ts` | `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `organizations.ts` | `getOrganization`, `updateOrganization` |
| `users.ts` | `getUsers`, `getUser` |
| `cashCounts.ts` | `getCashCounts`, `createCashCount`, `calculateExpectedBalance` |
| `reports.ts` | `getSummary`, `getByCategory`, `getDailyChart` |
| `receipts.ts` | `generateReceiptNumber`, `markAsPrinted` |

### 2.4 ลบ In-Memory Store

หลัง services พร้อม:
1. เปลี่ยน API routes จาก `@/lib/store` → `@/lib/services/*`
2. ลบ `src/lib/store/`
3. คง `src/data/mock/` ไว้สำหรับ dev/test เท่านั้น

---

## Phase 3 — API Transactions (CRUD + Void)

### 3.1 `GET /api/transactions`

**Query params:**

| Param | ค่า | คำอธิบาย |
|-------|-----|----------|
| `type` | `income` \| `expense` | กรองประเภท |
| `status` | `active` \| `void` | default: `active` |
| `startDate` | `YYYY-MM-DD` | ช่วงวันที่รายการ |
| `endDate` | `YYYY-MM-DD` | |
| `categoryId` | uuid | กรองหมวด |
| `paymentMethod` | string | กรองช่องทาง |
| `projectName` | string | กรองงาน/โครงการ |
| `search` | string | ค้นหา title, note, referenceNo |

**Response:**

```json
{
  "data": [ Transaction[] ],
  "total": 42
}
```

**สำคัญ:** filter และ sort ตาม `transaction_date` DESC ไม่ใช่ `created_at`

### 3.2 `POST /api/transactions`

**Body (validate ด้วย Zod):**

```json
{
  "type": "income",
  "categoryId": "cat-1",
  "title": "ขายปูนคุณสมชาย",
  "amount": 4500,
  "transactionDate": "2026-06-07",
  "paymentMethod": "cash",
  "referenceNo": "INV-2026-0042",
  "projectName": "โครงการบ้านทองหล่อ",
  "note": "รับเงินสดหน้าร้าน",
  "printReceipt": true
}
```

**Logic หลังบันทึก:**
1. สร้าง record `status: active`
2. ถ้า `printReceipt = true` → สร้าง `receiptNo` (auto increment)
3. ตั้ง `isPrinted: false` (อัปเดตเป็น true หลังพิมพ์สำเร็จ)
4. บันทึก `createdBy` จาก session user

### 3.3 `GET /api/transactions/[id]`

ดึงรายการเดียว พร้อม category name (join)

### 3.4 `PUT /api/transactions/[id]`

แก้ไขรายการที่ `status = active` เท่านั้น  
บันทึก `updatedBy`, `updatedAt`

### 3.5 `POST /api/transactions/[id]/void`

ยกเลิกรายการ (ไม่ลบ):

```json
{
  "voidReason": "จดซ้ำ",
  "voidedBy": "user-1"
}
```

ตั้ง `status: void`, `voidedAt`, `voidedBy`, `voidReason`

### 3.6 Validation

**ไฟล์:** `src/lib/validations/transaction.ts`

```typescript
transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  referenceNo: z.string().max(100).optional(),
  projectName: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  printReceipt: z.boolean().optional(),
});
```

---

## Phase 4 — API Categories + Organizations

### 4.1 Categories

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/categories` | `?type=income\|expense` |
| POST | `/api/categories` | สร้างหมวด |
| PUT | `/api/categories/[id]` | แก้ไข |
| DELETE | `/api/categories/[id]` | soft delete → `isActive: false` |

**Validation:** ห้ามชื่อซ้ำใน type เดียวกันภายใน org

**Seed หมวดเริ่มต้น** (ธุรกิจวัสดุ/จัดสวน) — ดู `frontend-tasks.md` Phase 1.2

### 4.2 Organizations

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/organizations` | ดึงข้อมูลกิจการ (MVP: 1 org) |
| PUT | `/api/organizations` | อัปเดตชื่อ, ที่อยู่, tax_id, receipt_config, hardware_config |

**`receipt_config` (JSONB):**

```json
{
  "header": "ชื่อกิจการ",
  "footer": "ขอบคุณที่อุดหนุน",
  "logoUrl": "",
  "receiptPrefix": "RCP"
}
```

**`hardware_config` (JSONB):**

```json
{
  "printerType": "thermal",
  "connectionType": "usb",
  "ip": "192.168.1.100",
  "port": 9100,
  "autoOpenDrawer": true,
  "bridgeUrl": "http://localhost:9101"
}
```

---

## Phase 5 — API Reports + Dashboard

### 5.1 `GET /api/reports/summary`

**Query:** `start`, `end` (default: เดือนปัจจุบัน)

**คำนวณจาก** `transactions WHERE status = active AND transaction_date BETWEEN start AND end`:

```typescript
{
  totalIncome: number,
  totalExpense: number,
  netProfit: number,
  dateRange: { start, end },
  transactionCount: number
}
```

### 5.2 `GET /api/reports/dashboard`

สรุปสำหรับหน้า Dashboard:

```typescript
{
  todayIncome: number,      // transaction_date = วันนี้
  todayExpense: number,
  monthIncome: number,      // transaction_date ในเดือนนี้
  monthExpense: number,
  netProfit: number,
  expectedCashBalance: number,  // จาก cash count ล่าสุด (ถ้ามี)
  transactionCount: number
}
```

### 5.3 `GET /api/reports/by-category`

**Query:** `start`, `end`, `type` (income/expense)

```json
{
  "data": [
    { "categoryId": "cat-1", "categoryName": "ค่าสินค้า", "total": 125000, "count": 15 }
  ]
}
```

### 5.4 `GET /api/reports/daily-chart`

**Query:** `start`, `end`

```json
{
  "data": [
    { "date": "2026-06-01", "income": 25000, "expense": 15000 }
  ]
}
```

**SQL ตัวอย่าง:**

```sql
SELECT transaction_date AS date,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
FROM transactions
WHERE organization_id = $1
  AND status = 'active'
  AND transaction_date BETWEEN $2 AND $3
GROUP BY transaction_date
ORDER BY transaction_date;
```

### 5.5 `GET /api/reports/export`

**Query:** `format=csv|xlsx`, `start`, `end`, `type`

ส่งไฟล์ดาวน์โหลด — คอลัมน์: วันที่, ประเภท, รายการ, หมวด, ช่องทาง, จำนวน, เลขอ้างอิง, หมายเหตุ

---

## Phase 6 — Cash Count (ปิดยอด / นับเงินสด)

### 6.1 สูตร (จากแผนภาพลูกค้า)

```
expectedBalance = openingBalance + cashIncome - cashExpense
variance = actualBalance - expectedBalance
status = balanced (0) | short (<0) | overage (>0)
```

โดย `cashIncome` / `cashExpense` = รายการ `payment_method = cash` และ `status = active` ในวัน `countDate`

### 6.2 API

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/cash-counts` | ประวัติปิดยอด |
| GET | `/api/cash-counts/today` | ปิดยอดวันนี้ (ถ้ามี) |
| POST | `/api/cash-counts` | บันทึกปิดยอด |

**POST body:**

```json
{
  "countDate": "2026-06-07",
  "openingBalance": 5000,
  "actualBalance": 20000,
  "note": "นับตอนปิดร้าน",
  "countedBy": "user-1"
}
```

**Server คำนวณ auto:**
- `expectedBalance` — จาก transactions วันนั้น
- `variance`
- `status`

### 6.3 Service

**ไฟล์:** `src/lib/services/cashCounts.ts`

```typescript
async function calculateExpectedBalance(
  organizationId: string,
  countDate: string,
  openingBalance: number
): Promise<number>
```

---

## Phase 7 — Receipt + Hardware API

### 7.1 เลขที่ใบเสร็จ

**ไฟล์:** `src/lib/utils/receiptNumber.ts`

Format: `RCP-2026-0001`

- ใช้ counter ต่อปี ต่อ organization
- เก็บใน DB (table `receipt_counters` หรือ query MAX)

### 7.2 `POST /api/receipts/[transactionId]/print`

**Flow:**
1. ดึง transaction + organization receipt_config
2. สร้าง/คืน `receiptNo` ถ้ายังไม่มี
3. ส่ง payload ไป Local Bridge (`hardware_config.bridgeUrl`)
4. ถ้าสำเร็จ → `isPrinted = true`, `printedAt = now()`
5. ถ้า `autoOpenDrawer` และ `paymentMethod = cash` → ส่ง drawer kick

**Response:**

```json
{
  "success": true,
  "receiptNo": "RCP-2026-0042",
  "printedAt": "2026-06-07T18:30:00Z"
}
```

### 7.3 `POST /api/hardware/print`

Proxy ไป Local Bridge — body เป็น ESC/POS payload หรือ receipt data

### 7.4 `POST /api/hardware/drawer`

Proxy เปิดลิ้นชัก — เรียก `lib/hardware/cashDrawer.ts`

**หมายเหตุ:** Backend ไม่คุย USB โดยตรง — ส่งต่อไป Bridge บนเครื่อง POS (Windows)  
รายละเอียด: `docs/hardware-plan.md`

---

## Phase 8 — Auth (MVP 1 คน)

### 8.1 Supabase Auth

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| POST | `/api/auth/login` | email + password |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | ข้อมูล user ปัจจุบัน |

**MVP:** สร้าง user เดียว (`admin`) ผ่าน seed  
**Role:** `admin` = CRUD ทุกอย่าง, `staff` = จดได้อย่างเดียว (อนาคต)

### 8.2 Middleware

**ไฟล์:** `src/middleware.ts`

- Protect routes: `/dashboard`, `/income`, `/expense`, ฯลฯ
- ยกเว้น: `/login`, `/api/auth/*`

### 8.3 Row Level Security (Supabase)

```sql
-- ตัวอย่าง: user เห็นเฉพาะ org ตัวเอง
CREATE POLICY "org_isolation" ON transactions
  FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id');
```

MVP single-tenant อาจใช้ service role ใน API ก่อน แล้วค่อย tighten RLS

---

## Phase 9 — Seed + Dev Tools

### 9.1 Seed Script

**ไฟล์:** `src/scripts/seed.ts`  
**รัน:** `npx tsx src/scripts/seed.ts` (เพิ่มใน `package.json`)

**Seed:**
1. Organization 1 แถว (ชื่อตัวอย่าง)
2. User 1 คน (admin)
3. Categories ตามธุรกิจวัสดุ/จัดสวน
4. Transactions ตัวอย่าง 8–10 รายการ
5. Cash count ตัวอย่าง 1 รายการ

**ห้ามใส่ข้อมูลลูกค้าจริง**

### 9.2 npm Scripts

```json
{
  "db:seed": "tsx src/scripts/seed.ts",
  "db:migrate": "supabase db push"
}
```

---

## Phase 10 — Error Handling + API Standards

### 10.1 Response Format

**Success:**

```json
{ "data": { ... }, "total": 10 }
```

**Error:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "จำนวนเงินต้องมากกว่า 0",
    "details": [{ "field": "amount", "message": "..." }]
  }
}
```

### 10.2 HTTP Status Codes

| Code | ใช้เมื่อ |
|------|---------|
| 200 | GET/PUT สำเร็จ |
| 201 | POST สร้างสำเร็จ |
| 400 | validation fail |
| 401 | ไม่ได้ login |
| 404 | ไม่พบ record |
| 409 | ชื่อหมวดซ้ำ / ปิดยอดซ้ำวันเดียวกัน |
| 500 | server error |

### 10.3 API Error Utility

**ไฟล์:** `src/lib/utils/apiError.ts`

```typescript
export function apiError(code: string, message: string, status: number)
export function validationError(zodError: ZodError)
```

---

## API Endpoints สรุปทั้งหมด

| Method | Endpoint | Phase |
|--------|----------|-------|
| GET | `/api/transactions` | 3 |
| POST | `/api/transactions` | 3 |
| GET | `/api/transactions/[id]` | 3 |
| PUT | `/api/transactions/[id]` | 3 |
| POST | `/api/transactions/[id]/void` | 3 |
| GET | `/api/categories` | 4 |
| POST | `/api/categories` | 4 |
| PUT | `/api/categories/[id]` | 4 |
| DELETE | `/api/categories/[id]` | 4 |
| GET | `/api/organizations` | 4 |
| PUT | `/api/organizations` | 4 |
| GET | `/api/users` | 4 |
| GET | `/api/reports/summary` | 5 |
| GET | `/api/reports/dashboard` | 5 |
| GET | `/api/reports/by-category` | 5 |
| GET | `/api/reports/daily-chart` | 5 |
| GET | `/api/reports/export` | 5 |
| GET | `/api/cash-counts` | 6 |
| GET | `/api/cash-counts/today` | 6 |
| POST | `/api/cash-counts` | 6 |
| POST | `/api/receipts/[id]/print` | 7 |
| POST | `/api/hardware/print` | 7 |
| POST | `/api/hardware/drawer` | 7 |
| POST | `/api/auth/login` | 8 |
| POST | `/api/auth/logout` | 8 |
| GET | `/api/auth/me` | 8 |

---

## สิ่งที่ Backend ไม่ต้องทำ

| ไม่ทำ | เหตุผล | ใครทำ |
|-------|--------|-------|
| UI / Component | งาน Frontend | Frontend |
| Local Bridge app | รันบนเครื่อง POS | Hardware / Mark |
| ESC/POS byte encoding เต็มรูปแบบ | อยู่ใน Bridge | Hardware |
| ระบบสินค้า / สต็อก | นอก scope | — |
| บัญชีเต็มรูปแบบ (GL, ผังบัญชี) | นอก scope | — |
| Multi-branch | นอก scope MVP | — |

---

## Definition of Done (Backend)

แต่ละ task ถือว่าเสร็จเมื่อ:

- [ ] API ทดสอบด้วย curl / Postman / Thunder Client ได้
- [ ] Validation ครบ (Zod) — ส่งข้อมูลผิดได้ error message ภาษาไทย
- [ ] ใช้ `transaction_date` ในรายงาน ไม่ใช่ `created_at`
- [ ] `npm run build` ผ่าน
- [ ] `npm run lint` ผ่าน
- [ ] มี error handling มาตรฐาน
- [ ] อัปเดต `docs/database-design.md` ถ้า schema เปลี่ยน
- [ ] PR มีตัวอย่าง request/response

---

## ลำดับทำงานแนะนำ (สอดคล้อง Frontend)

| สัปดาห์ | Backend | Frontend (อ้างอิง) |
|---------|---------|-------------------|
| 1 | Phase 1–2: Schema, Supabase, types, services | Phase 1–2: Branding, ฟอร์ม |
| 2 | Phase 3–4: Transactions + Categories API | Phase 3–4: ใบเสร็จ, filter |
| 3 | Phase 5–6: Reports + Cash count | Phase 5–6: Dashboard, ปิดยอด |
| 4 | Phase 7–8: Receipt/Hardware API + Auth | Phase 7–8: ตั้งค่า, เชื่อม API |
| 5 | Phase 9–10: Seed, polish, export | Phase 9: Responsive |

**จุด sync สำคัญ:**
- สัปดาห์ 2: Frontend เริ่มเชื่อม API transactions/categories
- สัปดาห์ 3: Frontend ใช้ reports + cash-counts API
- สัปดาห์ 4: ทดสอบ end-to-end บันทึก → พิมพ์ → ลิ้นชัก

---

## Branch / Commit

```
Branch:  feature/backend-<task-name>

Commit:
  [Backend] add supabase migration for transactions
  [Backend] implement transaction void API
  [Backend] add cash count service with expected balance calc
  [Backend] add reports by-category endpoint
  [Backend] add receipt number generator
  [Backend] connect API routes to supabase services
```

---

## เอกสารอ้างอิง

- [docs/database-design.md](./database-design.md) — Schema และ fields
- [docs/frontend-tasks.md](./frontend-tasks.md) — งาน Frontend (จุด sync API)
- [docs/hardware-plan.md](./hardware-plan.md) — Printer / Cash Drawer
- [docs/workflow.md](./workflow.md) — User flow
- [docs/scope.md](./scope.md) — ขอบเขต MVP
- `pos_workflow_tech_stack_plan.pdf` — Workflow + tech stack จากลูกค้า
