-- ============================================================
-- GO-LIVE: ลบข้อมูลทดสอบทั้งหมด (รันใน Supabase SQL Editor)
-- เก็บ: organizations, users, categories (6 หมวด)
-- ลบ: รายการ, audit, ฝาก, ถอน, ปิดยอด
-- ============================================================

DELETE FROM audit_logs;
DELETE FROM cash_deposits;
DELETE FROM cash_withdrawals;
DELETE FROM cash_counts;
DELETE FROM transaction_line_items;
DELETE FROM transactions;

-- ตรวจสอบ
SELECT 'transactions' AS tbl, COUNT(*) AS n FROM transactions
UNION ALL SELECT 'cash_deposits', COUNT(*) FROM cash_deposits
UNION ALL SELECT 'cash_withdrawals', COUNT(*) FROM cash_withdrawals
UNION ALL SELECT 'cash_counts', COUNT(*) FROM cash_counts
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
