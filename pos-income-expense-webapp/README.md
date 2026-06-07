# POS Income Expense — Coffee Shop Kiosk

ระบบบันทึกรายรับ-รายจ่ายสำหรับร้านกาแฟ ออกแบบสำหรับ **Desktop POS Swan 2** (Android 13 Kiosk, 15.6" 1080p Touchscreen)

> **สถานะ:** MVP UI/UX พร้อมใช้งาน / Mock Data / ยังไม่เชื่อม Database และ Hardware

## Target Device

| Spec | Detail |
|------|--------|
| **Device** | Desktop POS Swan 2 |
| **Display** | 15.6" Full HD 1920x1080 Touchscreen |
| **OS** | Android 13 (Kiosk Browser Mode) |
| **RAM** | 4GB |
| **CPU** | Octa-core A55 2.0GHz |
| **Speaker** | 15W |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Next.js API Routes |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Database | Mock (เตรียม Firebase / Supabase / PostgreSQL) |

## How to Install

```bash
git clone <repository-url>
cd pos-income-expense-webapp
npm install
```

## How to Run Dev

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

- `/login` — หน้า Login (Mock)
- `/dashboard` — Dashboard หลัก

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | รัน development server |
| `npm run build` | Build production |
| `npm run start` | รัน production server |
| `npm run lint` | ตรวจ ESLint |

## Folder Structure

```
pos-income-expense-webapp/
├── docs/                    # เอกสารโปรเจกต์
├── public/
├── src/
│   ├── app/                 # Next.js App Router (pages + API)
│   │   ├── api/             # API Routes (mock)
│   │   ├── dashboard/
│   │   ├── income/
│   │   ├── expense/
│   │   ├── categories/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── login/
│   ├── components/
│   │   ├── layout/          # Sidebar, Header, AppLayout
│   │   ├── ui/              # Button, Input, Card, ...
│   │   ├── forms/           # TransactionForm
│   │   ├── tables/          # DataTable, TransactionTable
│   │   └── charts/          # IncomeExpenseChart
│   ├── constants/
│   ├── data/mock/           # Mock data
│   ├── lib/
│   │   ├── db/              # Database adapters (placeholder)
│   │   ├── hardware/        # Printer, Cash Drawer (placeholder)
│   │   ├── utils/
│   │   └── validations/
│   ├── receipt-templates/   # Receipt template
│   └── types/
└── README.md
```

## Team Workflow

ทีม 3 คน แบ่งงานตาม `docs/team-workflow.md`:

| สมาชิก | หน้าที่หลัก |
|--------|------------|
| **Mark** | System Architecture, Hardware Integration, Code Review |
| **Frontend Developer** | UI Pages, Components, Responsive |
| **Backend Developer** | API, Database, Reports, Business Logic |

### Git Workflow

| Branch | 用途 |
|--------|------|
| `main` | Production / stable |
| `dev` | รวมงานก่อน release |
| `feature/frontend-dashboard` | งาน Frontend |
| `feature/backend-transactions` | งาน Backend |
| `feature/hardware-printer` | งาน Hardware |

**กฎการทำงาน**

1. แตก branch จาก `dev`
2. ทำงานใน feature branch ของตัวเอง
3. เปิด **Pull Request** ก่อน merge เข้า `dev`
4. Review โดย Mark (หรือตามที่ทีมกำหนด)
5. Merge `dev` → `main` เมื่อพร้อม release

### Branch Naming

```
feature/<area>-<short-description>
fix/<area>-<short-description>
docs/<topic>
```

ตัวอย่าง:

- `feature/frontend-dashboard`
- `feature/backend-transactions`
- `feature/hardware-printer`
- `fix/frontend-sidebar-mobile`
- `docs/update-workflow`

### Commit Message Format

ใช้ prefix ตามพื้นที่งาน:

```
[Frontend] create dashboard layout
[Backend] add transaction API mock
[Hardware] prepare printer integration placeholder
[Docs] update workflow document
```

## API Endpoints (Mock)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | ดึงรายการ (รองรับ `?type=income\|expense`) |
| POST | `/api/transactions` | สร้างรายการใหม่ |
| GET | `/api/categories` | ดึงหมวดหมู่ |
| POST | `/api/categories` | สร้างหมวดหมู่ใหม่ |
| GET | `/api/reports/summary` | สรุปรายงาน |

## Documentation

- [docs/scope.md](./docs/scope.md) — ขอบเขต MVP
- [docs/workflow.md](./docs/workflow.md) — User workflow
- [docs/hardware-plan.md](./docs/hardware-plan.md) — แผนเชื่อม hardware
- [docs/team-workflow.md](./docs/team-workflow.md) — แบ่งงานทีม

## สิ่งที่ทำแล้ว (UI/UX + Kiosk)

### Visual Design
- [x] **Color palette** สดใส friendly (Brand `#FF6B35`, Income `#10B981`, Expense `#EF4444`)
- [x] **Rounded corners** `16px` ทุก card, button, input
- [x] **Soft shadow** `rgba(15,23,42,0.06)` บน card
- [x] **System font** (`system-ui`, `Noto Sans Thai`) สำหรับ Android 13

### Kiosk Touch Optimizations
- [x] **Tap target** `56-64px` ขั้นต่ำทุกปุ่ม/แถว
- [x] **No hover** — ใช้ `active:` แทนทั้งระบบ (`active:scale-[0.97]`)
- [x] **Transition** จำกัด `max 150ms`
- [x] **Viewport lock** `user-scalable=no`
- [x] **Touch action** `manipulation`

### Layout (1080p เต็มจอ)
- [x] **Dashboard** 2 คอลัมน์: Chart ซ้าย + Recent ขวา
- [x] **Income/Expense** 2 คอลัมน์: Summary ซ้าย + Table ขวา
- [x] **Sidebar** แสดงตลอด (`w-72`)
- [x] **Header** Back button + Live clock `HH:MM`

### Components ใหม่
- [x] `Dialog` — Confirm modal
- [x] `ToastProvider` — Toast queue (`useToast()`)
- [x] `Skeleton` / `SkeletonCard` / `SkeletonTable` / `SkeletonChart`
- [x] `EmptyState` — ตารางว่างมี icon + action
- [x] `SearchBar` — Touch-friendly search

### Form UX
- [x] **Numpad** `88px` ต่อปุ่ม
- [x] **Category grid** กดเลือก
- [x] **Payment method grid** กดเลือก
- [x] **Date picker** `type="date"`
- [x] **Card top border** สีตาม type
- [x] **Amount display** `text-5xl` อ่านจาก 50cm

### Dashboard
- [x] Action buttons มี icon (`ArrowUpCircle`, `ArrowDownCircle`)
- [x] Stat cards (`border-l-4`, icon bg สี, `text-4xl font-black`)
- [x] Search + Filter บน `/income`, `/expense`

### Build
- [x] `output: "standalone"` สำหรับ deploy บน kiosk

---

## สิ่งที่เหลือ (Next Steps)

### UX/UI
- [ ] **PIN Login** — numpad 4 หลัก แทน email/password
- [ ] **Date filter chips** — `วันนี้ / สัปดาห์นี้ / เดือนนี้`
- [ ] **Sticky bottom action bar** — ปุ่มบันทึกติดด้านล่างฟอร์ม
- [ ] **Row actions** — Edit/Delete/Receipt ต่อแถวตาราง
- [ ] **Pagination / Load more** — ตารางข้อมูลเยอะ
- [ ] **Receipt print layout** — ฟอร์แมตเหมือนใบเสร็จจริง
- [ ] **Badge status** — `ชำระแล้ว / รอดำเนินการ`
- [ ] **Sound feedback** — เมื่อบันทึกสำเร็จ (speaker 15W)
- [ ] **Auto-lock** — หลัง inactive

### Backend & Infrastructure
- [ ] Connect real database (Firebase / Supabase / PostgreSQL)
- [ ] Authentication system (JWT / OAuth)
- [ ] Real API endpoints (CRUD)

### Hardware
- [ ] Thermal Printer integration
- [ ] Cash Drawer integration
- [ ] Local Bridge service
