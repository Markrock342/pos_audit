-- ============================================================
-- GO-LIVE: ลบข้อมูลทดสอบทั้งหมด (รันใน Supabase SQL Editor)
-- ============================================================
-- แนะนำใช้ supabase-clear-all-business-data.sql แทน (มีลำดับ FK + ตรวจสอบครบ)
-- ไฟล์นี้ = แบบสั้น ลบทุก org ทั้งระบบ
-- ============================================================

-- ปลด FK ถอนเคลียร์ลิ้นชัก
UPDATE cash_counts SET clear_drawer_withdrawal_id = NULL
WHERE clear_drawer_withdrawal_id IS NOT NULL;

DELETE FROM audit_logs;
DELETE FROM cash_count_close_events;  -- ถ้าไม่มีตารางนี้ ให้ comment บรรทัดนี้
DELETE FROM cash_deposits;
DELETE FROM cash_withdrawals;
DELETE FROM cash_counts;
DELETE FROM transaction_line_items;
DELETE FROM transactions;

-- ตรวจสอบ
SELECT 'transactions' AS tbl, COUNT(*) AS n FROM transactions
UNION ALL SELECT 'transaction_line_items', COUNT(*) FROM transaction_line_items
UNION ALL SELECT 'cash_deposits', COUNT(*) FROM cash_deposits
UNION ALL SELECT 'cash_withdrawals', COUNT(*) FROM cash_withdrawals
UNION ALL SELECT 'cash_counts', COUNT(*) FROM cash_counts
UNION ALL SELECT 'cash_count_close_events', COUNT(*) FROM cash_count_close_events
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
