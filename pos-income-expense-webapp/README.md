# POS Income Expense — สมุดรายรับ-รายจ่าย

ระบบบันทึกรายรับ-รายจ่ายสำหรับร้านกาแฟ ออกแบบสำหรับ **Desktop POS / Tablet Kiosk** (touch-first)

> **Version 1.0.0** — เชื่อม Supabase จริง · Deploy บน Vercel

## Production

- **URL:** https://pos-audit.vercel.app
- **Login:** `peeraphat` / PIN `0000` (เปลี่ยนได้ที่ ตั้งค่า → PIN เข้าระบบ)

## Quick Start (Local)

```bash
cd pos-income-expense-webapp
cp .env.example .env.local
# ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
# รัน SQL ตาม docs/SUPABASE-SETUP.md ก่อนครั้งแรก
npm run db:seed
npm run dev
```

เปิด http://localhost:3000/login

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed categories + org |
| `npm run db:clear` | Clear transactions (keep org) |
| `npm run db:clear-daily-close` | Clear cash counts + withdrawals |
| `npm run db:status` | Row counts in DB |
| `npm run bridge` | Hardware bridge (printer/drawer) |

## ฟีเจอร์หลัก

- บันทึกรายรับ / รายจ่าย (หลายบรรทัดต่อใบ, สด/โอน)
- ปิดยอดเงินสดรายวัน + ถอนเงิน + สรุป 2 กระเป๋า
- สรุปเงินทั้งเดือน, รายงาน, ส่งออก CSV
- ตั้งค่าร้าน, เงินเริ่มต้นเดือน, PIN login, ลิ้นชัก/พิมพ์ทดสอบ
- Audit log แก้ไข/ยกเลิก

## Documentation

| เอกสาร | 内容 |
|--------|------|
| [docs/RELEASE-v1.0.0.md](./docs/RELEASE-v1.0.0.md) | **ส่งมอบ v1.0.0** |
| [docs/SUPABASE-SETUP.md](./docs/SUPABASE-SETUP.md) | SQL checklist |
| [docs/scope.md](./docs/scope.md) | ขอบเขตฟีเจอร์ |
| [docs/workflow.md](./docs/workflow.md) | Workflow รายวัน |
| [.env.example](./.env.example) | ตัวแปร environment |

## ทดสอบ

```bash
npm run build && npm run lint
npm run dev
# terminal ใหม่:
npx tsx src/scripts/integration-test.ts
bash scripts/test-software.sh
```

## Security (Kiosk)

- Session + PIN override เก็บใน browser — ใช้บนเครื่อง kiosk ที่ควบคุมได้
- อย่า commit `.env.local` หรือ `SUPABASE_SERVICE_ROLE_KEY`
- เปลี่ยน PIN หลังติดตั้ง

## Target Device

| Spec | Detail |
|------|--------|
| Display | 10–15" touch (1080p) |
| Browser | Chrome / Kiosk mode |
| Hardware | iMin thermal printer + cash drawer (optional bridge)
