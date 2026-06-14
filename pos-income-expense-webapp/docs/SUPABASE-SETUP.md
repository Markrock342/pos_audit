# Supabase Setup Checklist

รันใน **Supabase Dashboard → SQL Editor** ตามลำดับ (ครั้งเดียวต่อโปรเจกต์)

| # | ไฟล์ | 用途 |
|---|------|------|
| 1 | `supabase-schema.sql` | ตารางหลัก + RLS พื้นฐาน |
| 2 | `supabase-transaction-line-items.sql` | รายการหลายบรรทัดต่อใบ |
| 3 | `supabase-transaction-line-items-rls-fix.sql` | แก้ RLS line items (ถ้ามี error) |
| 4 | `supabase-finance-config.sql` | ยอดเริ่มต้นเดือนใน org |
| 5 | `supabase-audit-logs.sql` | ประวัติแก้ไข |
| 6 | `supabase-cash-count-close.sql` | ปิดยอดเงินสด |
| 7 | `supabase-cash-count-close-rls-fix.sql` | แก้ RLS ปิดยอด |
| 8 | `supabase-cash-withdrawals.sql` | ถอนเงินจาก POS |
| 9 | `supabase-daily-close-ledger.sql` | สรุป 2 กระเป๋า / daily close |
| 10 | `supabase-admin-clear-daily-close.sql` | (optional) RPC ลบประวัติปิดยอด |

หลังรัน SQL:

```bash
cp .env.example .env.local
# ใส่ URL + anon key จาก Supabase → Settings → API

npm install
npm run db:seed    # หมวดหมู่ + org (ไม่ทับ org ที่มีอยู่)
npm run dev
```

ตรวจสอบ:

```bash
npm run db:status
npx tsx src/scripts/integration-test.ts   # ต้องรัน dev server ก่อน
```

ล้างข้อมูลทดสอบ:

```bash
npm run db:clear              # รายการ + หมวด (ปิดยอดต้องมี RPC หรือ service role)
npm run db:clear-daily-close  # เฉพาะประวัติปิดยอด + ถอนเงิน
```
