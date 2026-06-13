# แผนโครงการ — ปิดยอด + ถอนเงิน + สมุด 2 กระเป๋า

> อัปเดต: 2026-06-08 — เริ่ม implement ตาม Phase

## Phase 0 — ตรวจฐาน ✅

- [x] มี `docs/supabase-cash-count-close.sql` + RLS fix
- [x] มี `docs/supabase-finance-config.sql`
- [ ] **รัน `docs/supabase-cash-withdrawals.sql` ใน Supabase** (จำเป็นก่อนใช้ถอนเงินจริง)
- [ ] ยืนยัน pg_cron `auto_close_cash_counts_bkk` ทำงาน

## Phase 1 — ถอนเงินจาก POS ✅ (โค้ดพร้อม — รอ migration)

- [x] SQL `cash_withdrawals` + อัปเดต `fn_cash_expected_balance`
- [x] Service + API (`/api/cash-withdrawals`, `/today`)
- [x] UI ถอน + ประวัติวันนี้ + ยอดรวม
- [x] หน้า `/cash-count/withdrawals`

## Phase 2 — สรุป 2 กระเป๋า Real-time ✅

- [x] `getDailyLedgerSummary()` — สด + โอน + สรุปธุรกิจ
- [x] API `/api/daily-close/today` + `/api/daily-close/[date]`
- [x] UI `DailyLedgerSummaryPanel` บนหน้า `/cash-count`
- [x] ปรับ label หน้า `/balance`

## Phase 3 — ปิด 00:00 snapshot + carry forward ✅

- [x] SQL `supabase-daily-close-ledger.sql` — snapshot columns + fn_auto_close
- [x] `refreshOpenDailyCloseRecord` — sync ledger fields real-time
- [x] Carry forward `closing_cash` / `closing_transfer` → opening วันถัดไป
- [ ] **รัน SQL ใน Supabase** (จำเป็นสำหรับ snapshot ใน DB)

## Phase 4 — UI ปิดยอด + ประวัติรายวัน ✅

- [x] หน้า `/cash-count/[date]` — สรุป 2 กระเป๋า + นับเงิน + ถอนรายวัน
- [x] `CashCountHistory` คลิกไปรายละเอียดวัน
- [x] `DailyCloseStatusCard` บน dashboard
- [x] ย้ายฟอร์มนับเงินไป `<details>` (ไม่บังคับ)

## Phase 5 — ช่องทาง สด/โอน + polish
