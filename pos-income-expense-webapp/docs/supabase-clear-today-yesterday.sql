-- ============================================================
-- ลบข้อมูล "วันนี้" + "เมื่อวาน" (Asia/Bangkok)
-- ใช้ใน Supabase → SQL Editor → Run
-- ============================================================
--
-- ลบเฉพาะ:
--   • รายรับ / รายจ่าย (+ รายการย่อย + audit ที่ผูก transaction)
--   • ฝากเงินสด / ถอนเงินสด
--   • ปิดยอด (cash_counts) + ประวัติ event ปิดยอด (ถ้ามีตาราง)
--
-- เก็บไว้:
--   • organizations, users, categories
--   • ข้อมูลวันอื่นที่เก่ากว่าเมื่อวาน
--
-- เปลี่ยน org ได้ที่ v_org_id ด้านล่าง (NULL = ทุก org)
-- ============================================================

DO $$
DECLARE
  v_org_id UUID := '11111111-1111-1111-1111-111111111111';  -- ร้านลูกค้า (NULL = ทุก org)
  v_today DATE := (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE;
  v_yesterday DATE := v_today - 1;
  v_dates DATE[] := ARRAY[v_yesterday, v_today];
  n_audit INT;
  n_lines INT;
  n_txn INT;
  n_dep INT;
  n_wd INT;
  n_events INT;
  n_counts INT;
BEGIN
  RAISE NOTICE '=== ลบข้อมูลวันที่ % และ % (Bangkok) ===', v_yesterday, v_today;
  IF v_org_id IS NOT NULL THEN
    RAISE NOTICE 'organization_id = %', v_org_id;
  ELSE
    RAISE NOTICE 'organization_id = ALL';
  END IF;

  -- 1) audit ของ transaction ในช่วงวันที่
  DELETE FROM audit_logs al
  USING transactions t
  WHERE al.entity_type = 'transaction'
    AND al.entity_id = t.id
    AND t.transaction_date = ANY (v_dates)
    AND (v_org_id IS NULL OR t.organization_id = v_org_id);
  GET DIAGNOSTICS n_audit = ROW_COUNT;
  RAISE NOTICE 'audit_logs (transaction): %', n_audit;

  -- 2) ปลด FK ถอนเคลียร์ลิ้นชัก (ถ้ามีคอลัมน์)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_counts' AND column_name = 'clear_drawer_withdrawal_id'
  ) THEN
    UPDATE cash_counts
    SET clear_drawer_withdrawal_id = NULL
    WHERE count_date = ANY (v_dates)
      AND (v_org_id IS NULL OR organization_id = v_org_id);
  END IF;

  -- 3) รายการย่อย
  DELETE FROM transaction_line_items li
  USING transactions t
  WHERE li.transaction_id = t.id
    AND t.transaction_date = ANY (v_dates)
    AND (v_org_id IS NULL OR t.organization_id = v_org_id);
  GET DIAGNOSTICS n_lines = ROW_COUNT;
  RAISE NOTICE 'transaction_line_items: %', n_lines;

  -- 4) รายรับ / รายจ่าย
  DELETE FROM transactions
  WHERE transaction_date = ANY (v_dates)
    AND (v_org_id IS NULL OR organization_id = v_org_id);
  GET DIAGNOSTICS n_txn = ROW_COUNT;
  RAISE NOTICE 'transactions: %', n_txn;

  -- 5) ฝาก / ถอน
  IF to_regclass('public.cash_deposits') IS NOT NULL THEN
    DELETE FROM cash_deposits
    WHERE deposit_date = ANY (v_dates)
      AND (v_org_id IS NULL OR organization_id = v_org_id);
    GET DIAGNOSTICS n_dep = ROW_COUNT;
    RAISE NOTICE 'cash_deposits: %', n_dep;
  END IF;

  IF to_regclass('public.cash_withdrawals') IS NOT NULL THEN
    DELETE FROM cash_withdrawals
    WHERE withdrawal_date = ANY (v_dates)
      AND (v_org_id IS NULL OR organization_id = v_org_id);
    GET DIAGNOSTICS n_wd = ROW_COUNT;
    RAISE NOTICE 'cash_withdrawals: %', n_wd;
  END IF;

  -- 6) ประวัติ event ปิดยอด (ถ้ามี migration close-edit)
  IF to_regclass('public.cash_count_close_events') IS NOT NULL THEN
    DELETE FROM cash_count_close_events
    WHERE count_date = ANY (v_dates)
      AND (v_org_id IS NULL OR organization_id = v_org_id);
    GET DIAGNOSTICS n_events = ROW_COUNT;
    RAISE NOTICE 'cash_count_close_events: %', n_events;
  END IF;

  -- 7) ปิดยอด / นับเงิน
  DELETE FROM cash_counts
  WHERE count_date = ANY (v_dates)
    AND (v_org_id IS NULL OR organization_id = v_org_id);
  GET DIAGNOSTICS n_counts = ROW_COUNT;
  RAISE NOTICE 'cash_counts: %', n_counts;

  RAISE NOTICE '=== เสร็จ ===';
END $$;

-- ตรวจสอบหลังลบ (ควรเป็น 0 สำหรับวันนี้/เมื่อวาน)
WITH bounds AS (
  SELECT
    (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE AS today,
    (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE - 1 AS yesterday
)
SELECT 'transactions' AS tbl, COUNT(*) AS n
FROM transactions t, bounds b
WHERE t.transaction_date IN (b.yesterday, b.today)
  AND t.organization_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'cash_deposits', COUNT(*)
FROM cash_deposits d, bounds b
WHERE d.deposit_date IN (b.yesterday, b.today)
  AND d.organization_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'cash_withdrawals', COUNT(*)
FROM cash_withdrawals w, bounds b
WHERE w.withdrawal_date IN (b.yesterday, b.today)
  AND w.organization_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'cash_counts', COUNT(*)
FROM cash_counts c, bounds b
WHERE c.count_date IN (b.yesterday, b.today)
  AND c.organization_id = '11111111-1111-1111-1111-111111111111';
