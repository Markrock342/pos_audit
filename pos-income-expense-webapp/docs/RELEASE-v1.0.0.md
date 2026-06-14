# Release v1.0.0 — สมุดรายรับ-รายจ่าย (Kiosk)

**วันที่:** 2026-06-14  
**Production:** https://pos-audit.vercel.app  
**Version:** 1.0.0

---

## สิ่งที่ส่งมอบ

- Web app บันทึกรายรับ/รายจ่าย สำหรับ tablet/kiosk ร้านกาแฟ
- เชื่อม **Supabase** (PostgreSQL) จริง
- ปิดยอดเงินสดรายวัน, ถอนเงิน, สรุปเดือน, รายงาน/CSV
- พิมพ์ใบเสร็จ / ใบสำคัญจ่าย (iMin thermal), เปิดลิ้นชัก
- Audit log การแก้ไข/ยกเลิก

---

## เข้าใช้งาน

| รายการ | ค่า |
|--------|-----|
| URL | https://pos-audit.vercel.app |
| บัญชีลูกค้า | `peeraphat` |
| PIN เริ่มต้น | `0000` |
| เปลี่ยน PIN | ตั้งค่า → **PIN เข้าระบบ** |
| รหัสเปิดลิ้นชัก | `0000` (เปลี่ยนได้ที่ ตั้งค่า → ลิ้นชัก) |

บัญชีซ่อน (ทีมเท่านั้น): `lcs` / `dev` (PIN dev = `9999`)

---

## ติดตั้ง / Deploy

1. รัน SQL ตาม [docs/SUPABASE-SETUP.md](./SUPABASE-SETUP.md)
2. ตั้ง env ตาม [.env.example](../.env.example) บน Vercel
3. `npm run db:seed` ครั้งแรก
4. เปลี่ยน PIN `peeraphat` หลังติดตั้ง

---

## ข้อจำกัดที่ต้องรู้ (Kiosk MVP)

- **Login** เก็บ session ใน browser (localStorage) — เหมาะเครื่อง kiosk ปิดในร้าน
- **PIN override** เก็บต่อเครื่อง — เปลี่ยน PIN บน tablet หนึ่ง ไม่ sync ไปเครื่องอื่น
- **API** ใช้ header `X-Kiosk-Role` จาก client — ไม่ใช่ enterprise auth
- **RLS** ป้องกันข้อมูลที่ Supabase — อย่าเผย `service_role` key

---

## ทดสอบก่อนส่ง

```bash
npm run build
npm run lint
npm run dev
# terminal อื่น:
npx tsx src/scripts/integration-test.ts   # 49/49
bash scripts/test-software.sh
```

---

## Scripts

| คำสั่ง | 用途 |
|--------|------|
| `npm run dev` | พัฒนา local |
| `npm run build` | build production |
| `npm run db:seed` | seed หมวดหมู่ + org |
| `npm run db:clear` | ล้างรายการ (เก็บ org) |
| `npm run db:clear-daily-close` | ล้างปิดยอด/ถอน |
| `npm run db:status` | นับแถวใน DB |

---

## เอกสารเพิ่ม

- [README.md](../README.md) — ภาพรวมโปรเจกต์
- [docs/scope.md](./scope.md) — ขอบเขตฟีเจอร์
- [docs/workflow.md](./workflow.md) — workflow รายวัน
