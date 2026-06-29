-- ============================================================
-- Migration: ปิดยอดหลายรอบต่อวัน (ปิดยอดใหม่ = เปิดร้านรอบใหม่)
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → Run (ครั้งเดียว)
-- ต้องรัน supabase-close-edit-reopen.sql ก่อนแล้ว
--
-- พฤติกรรม:
--   • ปิดยอดรอบ N → เคลียร์ลิ้นชัก + ซ่อนข้อมูลรอบ N จากหน้างาน
--   • ปิดยอดใหม่ → เริ่มรอบ N+1 ยอดเริ่ม 0 (ไม่ดึงข้อมูลเก่า)
--   • แก้ไขปิดยอด → ยังเป็น flow เดิม (คืน snapshot รอบเดิม)
--   • รายงาน/ประวัติ → รวมทุกรอบของวัน
-- ============================================================

-- 1) session_round บน cash_counts
ALTER TABLE cash_counts
  ADD COLUMN IF NOT EXISTS session_round INT NOT NULL DEFAULT 1;

COMMENT ON COLUMN cash_counts.session_round IS
  'รอบการทำงานในวันเดียว — เพิ่มเมื่อกดปิดยอดใหม่';

-- 2) session_round บนรายการ
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS session_round INT NOT NULL DEFAULT 1;

ALTER TABLE cash_deposits
  ADD COLUMN IF NOT EXISTS session_round INT NOT NULL DEFAULT 1;

ALTER TABLE cash_withdrawals
  ADD COLUMN IF NOT EXISTS session_round INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_txn_org_date_round
  ON transactions (organization_id, transaction_date, session_round);

CREATE INDEX IF NOT EXISTS idx_deposits_org_date_round
  ON cash_deposits (organization_id, deposit_date, session_round);

CREATE INDEX IF NOT EXISTS idx_withdrawals_org_date_round
  ON cash_withdrawals (organization_id, withdrawal_date, session_round);

-- 3) ขยาย event type + session_round บน close events
ALTER TABLE cash_count_close_events
  ADD COLUMN IF NOT EXISTS session_round INT NOT NULL DEFAULT 1;

ALTER TABLE cash_count_close_events
  DROP CONSTRAINT IF EXISTS cash_count_close_events_event_type_check;

ALTER TABLE cash_count_close_events
  ADD CONSTRAINT cash_count_close_events_event_type_check
  CHECK (event_type IN ('close', 'reopen_edit', 'close_after_edit', 'new_round'));

-- 4) RPC: เริ่มรอบใหม่หลังปิดยอดแล้ว
CREATE OR REPLACE FUNCTION fn_start_new_close_round(
  p_organization_id UUID,
  p_count_date DATE DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE;
  v_row cash_counts%ROWTYPE;
  v_new_round INT;
BEGIN
  v_today := (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE;

  IF p_count_date IS NULL THEN
    p_count_date := v_today;
  END IF;

  IF p_count_date <> v_today THEN
    RAISE EXCEPTION 'เริ่มรอบใหม่ได้เฉพาะวันนี้ (% )', v_today;
  END IF;

  SELECT * INTO v_row FROM cash_counts
  WHERE organization_id = p_organization_id
    AND count_date = p_count_date
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ไม่พบ cash_counts สำหรับ %', p_count_date;
  END IF;

  IF v_row.closed_at IS NULL THEN
    RAISE EXCEPTION 'ยังไม่ได้ปิดยอด — ปิดยอดก่อนเริ่มรอบใหม่';
  END IF;

  IF v_row.close_edit_reopened_at IS NOT NULL THEN
    RAISE EXCEPTION 'อยู่ในโหมดแก้ไขปิดยอด — ปิดยอดใหม่หรือยกเลิกแก้ไขก่อน';
  END IF;

  v_new_round := COALESCE(v_row.session_round, 1) + 1;

  UPDATE cash_counts SET
    session_round = v_new_round,
    closed_at = NULL,
    closing_type = NULL,
    close_edit_reopened_at = NULL,
    close_snapshot = NULL,
    expected_balance = 0,
    actual_balance = 0,
    variance = 0,
    status = 'balanced',
    has_manual_count = false,
    opening_balance = 0,
    cash_income = 0,
    cash_expense = 0,
    cash_withdrawn = 0,
    closing_cash = 0,
    transfer_income = 0,
    transfer_expense = 0,
    closing_transfer = COALESCE(opening_transfer, 0),
    total_income = 0,
    total_expense = 0,
    net_total = 0,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = v_row.id;

  INSERT INTO cash_count_close_events (
    organization_id, cash_count_id, count_date, event_type,
    close_edit_generation, session_round,
    expected_balance, actual_balance, variance,
    closing_cash, user_id,
    note
  ) VALUES (
    p_organization_id, v_row.id, p_count_date, 'new_round',
    COALESCE(v_row.close_edit_generation, 0),
    v_new_round,
    0, 0, 0,
    0, p_user_id,
    'เริ่มรอบใหม่ — ยอดเริ่ม 0'
  );

  RETURN jsonb_build_object(
    'started_new_round', true,
    'count_date', p_count_date,
    'session_round', v_new_round
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_start_new_close_round(UUID, DATE, UUID)
  TO anon, authenticated, service_role;

-- 5) อัปเดต fn_record_close_event ให้บันทึก session_round
CREATE OR REPLACE FUNCTION fn_record_close_event(
  p_cash_count_id UUID,
  p_event_type VARCHAR(20),
  p_clear_drawer_withdrawal_id UUID DEFAULT NULL,
  p_clear_drawer_amount NUMERIC DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row cash_counts%ROWTYPE;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_row FROM cash_counts WHERE id = p_cash_count_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cash count not found';
  END IF;

  INSERT INTO cash_count_close_events (
    organization_id, cash_count_id, count_date, event_type,
    close_edit_generation, session_round,
    expected_balance, actual_balance, variance,
    closing_cash, clear_drawer_amount, clear_drawer_withdrawal_id, note, user_id
  ) VALUES (
    v_row.organization_id, v_row.id, v_row.count_date, p_event_type,
    COALESCE(v_row.close_edit_generation, 0),
    COALESCE(v_row.session_round, 1),
    v_row.expected_balance, v_row.actual_balance, v_row.variance,
    COALESCE((v_row.close_snapshot->>'closingCash')::NUMERIC, v_row.closing_cash),
    p_clear_drawer_amount, p_clear_drawer_withdrawal_id, p_note, p_user_id
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_record_close_event(UUID, VARCHAR, UUID, NUMERIC, UUID, TEXT)
  TO anon, authenticated, service_role;
