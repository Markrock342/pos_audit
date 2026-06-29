-- ============================================================
-- Admin RPC: ล้างข้อมูลวันเดียว (วันนี้เท่านั้น — Asia/Bangkok)
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → Run (ครั้งเดียว)
--
-- ลบเฉพาะวันที่ระบุ (API บังคับให้เป็นวันนี้เท่านั้น):
--   • รายรับ / รายจ่าย (+ รายการย่อย)
--   • audit ที่เกี่ยวข้อง (transaction / ฝาก / ถอน)
--   • ฝาก / ถอน / ปิดยอด / event ปิดยอด / รอบต่างๆ
--
-- เก็บไว้: organizations, users, categories, ข้อมูลวันอื่น
-- ============================================================

CREATE OR REPLACE FUNCTION fn_admin_clear_business_day(
  p_organization_id UUID,
  p_count_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE;
  n_audit_txn INT := 0;
  n_audit_dep INT := 0;
  n_audit_wd INT := 0;
  n_lines INT := 0;
  n_txn INT := 0;
  n_dep INT := 0;
  n_wd INT := 0;
  n_events INT := 0;
  n_counts INT := 0;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'ต้องระบุ organization_id';
  END IF;

  IF p_count_date IS NULL THEN
    p_count_date := v_today;
  END IF;

  IF p_count_date <> v_today THEN
    RAISE EXCEPTION 'ล้างข้อมูลได้เฉพาะวันนี้ (%)', v_today;
  END IF;

  -- ปลด FK ถอนเคลียร์ลิ้นชัก (ถ้ามี)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cash_counts'
      AND column_name = 'clear_drawer_withdrawal_id'
  ) THEN
    UPDATE cash_counts
    SET clear_drawer_withdrawal_id = NULL
    WHERE organization_id = p_organization_id
      AND count_date = p_count_date;
  END IF;

  -- audit ของ transaction
  DELETE FROM audit_logs al
  USING transactions t
  WHERE al.entity_type = 'transaction'
    AND al.entity_id = t.id
    AND t.organization_id = p_organization_id
    AND t.transaction_date = p_count_date;
  GET DIAGNOSTICS n_audit_txn = ROW_COUNT;

  -- audit ฝาก
  IF to_regclass('public.cash_deposits') IS NOT NULL THEN
    DELETE FROM audit_logs al
    USING cash_deposits d
    WHERE al.entity_type = 'cash_deposit'
      AND al.entity_id = d.id
      AND d.organization_id = p_organization_id
      AND d.deposit_date = p_count_date;
    GET DIAGNOSTICS n_audit_dep = ROW_COUNT;
  END IF;

  -- audit ถอน
  IF to_regclass('public.cash_withdrawals') IS NOT NULL THEN
    DELETE FROM audit_logs al
    USING cash_withdrawals w
    WHERE al.entity_type = 'cash_withdrawal'
      AND al.entity_id = w.id
      AND w.organization_id = p_organization_id
      AND w.withdrawal_date = p_count_date;
    GET DIAGNOSTICS n_audit_wd = ROW_COUNT;
  END IF;

  -- รายการย่อย
  DELETE FROM transaction_line_items li
  USING transactions t
  WHERE li.transaction_id = t.id
    AND t.organization_id = p_organization_id
    AND t.transaction_date = p_count_date;
  GET DIAGNOSTICS n_lines = ROW_COUNT;

  -- รายรับ / รายจ่าย
  DELETE FROM transactions
  WHERE organization_id = p_organization_id
    AND transaction_date = p_count_date;
  GET DIAGNOSTICS n_txn = ROW_COUNT;

  -- ฝาก / ถอน
  IF to_regclass('public.cash_deposits') IS NOT NULL THEN
    DELETE FROM cash_deposits
    WHERE organization_id = p_organization_id
      AND deposit_date = p_count_date;
    GET DIAGNOSTICS n_dep = ROW_COUNT;
  END IF;

  IF to_regclass('public.cash_withdrawals') IS NOT NULL THEN
    DELETE FROM cash_withdrawals
    WHERE organization_id = p_organization_id
      AND withdrawal_date = p_count_date;
    GET DIAGNOSTICS n_wd = ROW_COUNT;
  END IF;

  -- ประวัติ event ปิดยอด / รอบ
  IF to_regclass('public.cash_count_close_events') IS NOT NULL THEN
    DELETE FROM cash_count_close_events
    WHERE organization_id = p_organization_id
      AND count_date = p_count_date;
    GET DIAGNOSTICS n_events = ROW_COUNT;
  END IF;

  -- ปิดยอด / snapshot
  DELETE FROM cash_counts
  WHERE organization_id = p_organization_id
    AND count_date = p_count_date;
  GET DIAGNOSTICS n_counts = ROW_COUNT;

  RETURN jsonb_build_object(
    'cleared', true,
    'count_date', p_count_date,
    'organization_id', p_organization_id,
    'audit_logs_transaction', n_audit_txn,
    'audit_logs_deposit', n_audit_dep,
    'audit_logs_withdrawal', n_audit_wd,
    'transaction_line_items', n_lines,
    'transactions', n_txn,
    'cash_deposits', n_dep,
    'cash_withdrawals', n_wd,
    'close_events', n_events,
    'cash_counts', n_counts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_admin_clear_business_day(UUID, DATE)
  TO anon, authenticated, service_role;
