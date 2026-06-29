-- ============================================================
-- ลบข้อมูลธุรกิจทั้งหมด (ทุกวัน) — รันใน Supabase SQL Editor
-- โปรเจกต์: สมุดรายรับ-รายจ่าย POS
-- ============================================================
--
-- ⚠️  ไม่สามารถกู้คืนได้ — สำรองก่อนรันถ้าจำเป็น
--
-- ลบ:
--   • รายรับ / รายจ่าย (+ รายการย่อย)
--   • ประวัติ audit ทั้งหมด
--   • ฝาก / ถอน เงินสด
--   • ปิดยอด / นับเงิน / event ปิดยอดทุกรอบ
--
-- เก็บไว้:
--   • organizations (ชื่อร้าน, ตั้งค่า)
--   • users (บัญชี kiosk)
--   • categories (หมวดหมู่)
--
-- เปลี่ยน org ได้ที่ v_org_id ด้านล่าง:
--   • UUID ร้าน = ลบเฉพาะ org นั้น
--   • NULL = ลบทุก org ในระบบ
-- ============================================================

DO $$
DECLARE
  -- ร้านลูกค้า (เปลี่ยนเป็น NULL ถ้าต้องการลบทุก org)
  v_org_id UUID := '11111111-1111-1111-1111-111111111111';

  n_audit INT := 0;
  n_lines INT := 0;
  n_txn INT := 0;
  n_dep INT := 0;
  n_wd INT := 0;
  n_events INT := 0;
  n_counts INT := 0;
BEGIN
  RAISE NOTICE '=== เริ่มลบข้อมูลธุรกิจทั้งหมด ===';
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'ขอบเขต: ทุก organization';
  ELSE
    RAISE NOTICE 'ขอบเขต: organization_id = %', v_org_id;
  END IF;

  -- ปลด FK ถอนเคลียร์ลิ้นชัก (cash_counts → cash_withdrawals)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cash_counts'
      AND column_name = 'clear_drawer_withdrawal_id'
  ) THEN
    UPDATE cash_counts
    SET clear_drawer_withdrawal_id = NULL
    WHERE v_org_id IS NULL OR organization_id = v_org_id;
  END IF;

  -- 1) audit ทั้งหมดของ org (transaction / ฝาก / ถอน)
  IF v_org_id IS NULL THEN
    DELETE FROM audit_logs;
  ELSE
    DELETE FROM audit_logs al
    WHERE
      EXISTS (
        SELECT 1 FROM transactions t
        WHERE al.entity_type = 'transaction' AND al.entity_id = t.id
          AND t.organization_id = v_org_id
      )
      OR EXISTS (
        SELECT 1 FROM cash_deposits d
        WHERE al.entity_type = 'cash_deposit' AND al.entity_id = d.id
          AND d.organization_id = v_org_id
      )
      OR EXISTS (
        SELECT 1 FROM cash_withdrawals w
        WHERE al.entity_type = 'cash_withdrawal' AND al.entity_id = w.id
          AND w.organization_id = v_org_id
      );
  END IF;
  GET DIAGNOSTICS n_audit = ROW_COUNT;
  RAISE NOTICE 'audit_logs: %', n_audit;

  -- 2) event ปิดยอด / รอบ (ต้องลบก่อน cash_counts ถ้ามี FK)
  IF to_regclass('public.cash_count_close_events') IS NOT NULL THEN
    DELETE FROM cash_count_close_events
    WHERE v_org_id IS NULL OR organization_id = v_org_id;
    GET DIAGNOSTICS n_events = ROW_COUNT;
    RAISE NOTICE 'cash_count_close_events: %', n_events;
  END IF;

  -- 3) รายการย่อย
  IF v_org_id IS NULL THEN
    DELETE FROM transaction_line_items;
  ELSE
    DELETE FROM transaction_line_items li
    USING transactions t
    WHERE li.transaction_id = t.id AND t.organization_id = v_org_id;
  END IF;
  GET DIAGNOSTICS n_lines = ROW_COUNT;
  RAISE NOTICE 'transaction_line_items: %', n_lines;

  -- 4) รายรับ / รายจ่าย
  DELETE FROM transactions
  WHERE v_org_id IS NULL OR organization_id = v_org_id;
  GET DIAGNOSTICS n_txn = ROW_COUNT;
  RAISE NOTICE 'transactions: %', n_txn;

  -- 5) ฝาก / ถอน
  IF to_regclass('public.cash_deposits') IS NOT NULL THEN
    DELETE FROM cash_deposits
    WHERE v_org_id IS NULL OR organization_id = v_org_id;
    GET DIAGNOSTICS n_dep = ROW_COUNT;
    RAISE NOTICE 'cash_deposits: %', n_dep;
  END IF;

  IF to_regclass('public.cash_withdrawals') IS NOT NULL THEN
    DELETE FROM cash_withdrawals
    WHERE v_org_id IS NULL OR organization_id = v_org_id;
    GET DIAGNOSTICS n_wd = ROW_COUNT;
    RAISE NOTICE 'cash_withdrawals: %', n_wd;
  END IF;

  -- 6) ปิดยอด / snapshot
  DELETE FROM cash_counts
  WHERE v_org_id IS NULL OR organization_id = v_org_id;
  GET DIAGNOSTICS n_counts = ROW_COUNT;
  RAISE NOTICE 'cash_counts: %', n_counts;

  RAISE NOTICE '=== ลบเสร็จ ===';
  RAISE NOTICE 'transactions=%, line_items=%, deposits=%, withdrawals=%, close_events=%, cash_counts=%, audit=%',
    n_txn, n_lines, n_dep, n_wd, n_events, n_counts, n_audit;
END $$;

-- ── ตรวจสอบหลังลบ (ควรเป็น 0 ทุกแถว) ──
-- เปลี่ยน organization_id ให้ตรงกับ v_org_id ด้านบน
SELECT 'transactions' AS tbl, COUNT(*) AS n
FROM transactions
WHERE organization_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'cash_deposits', COUNT(*)
FROM cash_deposits
WHERE organization_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'cash_withdrawals', COUNT(*)
FROM cash_withdrawals
WHERE organization_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'cash_counts', COUNT(*)
FROM cash_counts
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- ถ้ามีตาราง cash_count_close_events แล้ว รันเพิ่ม:
-- SELECT COUNT(*) AS close_events_remaining FROM cash_count_close_events
-- WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- ── (ทางเลือก) รีเซ็ตเงินเริ่มต้นเดือนใน organizations ──
-- UPDATE organizations
-- SET finance_config = jsonb_set(
--   COALESCE(finance_config, '{}'::jsonb),
--   '{openingCashBalance}',
--   '0'::jsonb
-- )
-- WHERE id = '11111111-1111-1111-1111-111111111111';
