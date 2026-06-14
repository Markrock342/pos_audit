-- ลบประวัติปิดยอด + ถอนเงินสด ทันที (รันใน Supabase SQL Editor)
-- Dashboard → SQL → New query → วาง → Run
--
-- หมายเหตุ: สคริปต npm ลบไม่ได้เพราะ RLS ห้าม DELETE ผ่าน anon key
--           แต่ SQL Editor รันเป็น postgres — ลบได้จริง

DELETE FROM cash_withdrawals;
DELETE FROM cash_counts;

-- ตรวจสอบ (ควรได้ 0, 0)
SELECT
  (SELECT COUNT(*) FROM cash_withdrawals) AS withdrawals_remaining,
  (SELECT COUNT(*) FROM cash_counts) AS cash_counts_remaining;
