# pos-income-expense-webapp

Web App สำหรับร้านกาแฟ — บันทึกรายรับ-รายจ่าย ดูสรุปยอด พิมพ์ใบเสร็จ และเตรียมรองรับ Thermal Printer / Cash Drawer ในอนาคต

## Project Overview

ระบบ POS / บันทึกรายรับ-รายจ่าย ออกแบบให้ทีมพัฒนา 3 คนเริ่มงานได้ทันที โดยรอบแรกเป็น **scaffold + placeholder UI + mock data** ยังไม่เชื่อม database และ hardware จริง

### ฟีเจอร์เป้าหมาย (MVP)

- บันทึกรายรับ / รายจ่าย
- จัดการหมวดหมู่
- Dashboard สรุปยอด
- รายงานและกราฟ
- พิมพ์ใบเสร็จ (เตรียม template)
- เชื่อม Printer / Cash Drawer (อนาคต)

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

## Next Steps

1. Frontend — ปรับ UI ให้สมบูรณ์และเชื่อม API จริง
2. Backend — เลือก database และ implement CRUD
3. Hardware — พัฒนา Local Bridge สำหรับ printer/drawer
4. Auth — เพิ่มระบบ login จริง
