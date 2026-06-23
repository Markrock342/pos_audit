-- ============================================================
-- Migration: แก้ไขปิดยอด (reopen วันเดียวกันเพื่อแก้รายการ)
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → Run (ครั้งเดียว)
-- จากนั้น deploy โค้ดแอปที่เรียก fn_reopen_close_for_edit
--
-- สรุปพฤติกรรมที่ออกแบบ:
--   • ปิดยอด → เก็บ snapshot ก่อนเคลียร์ลิ้นชัก + บันทึก event "close"
--   • แก้ไขปิดยอด (วันนี้เท่านั้น) → ลบถอนเคลียร์ลิ้นชัก, เปิด closed_at,
--     คืนยอด POS/dashboard จาก snapshot, บันทึก event "reopen_edit"
--   • รายการที่แก้ระหว่าง reopen ใส่ close_edit_generation ใน audit_logs
--   • ปิดยอดอีกครั้ง → generation +1, snapshot ใหม่
-- ============================================================


-- 1) คอลัมน์ติดตามรอบปิด/แก้ไขบน cash_counts
ALTER TABLE cash_counts
  ADD COLUMN IF NOT EXISTS close_edit_generation INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS close_edit_reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS close_snapshot JSONB;

COMMENT ON COLUMN cash_counts.close_edit_generation IS
  'รอบปิดยอด — 0=ปิดครั้งแรก, +1 ทุกครั้งที่กดแก้ไขปิดยอดแล้วปิดใหม่';
COMMENT ON COLUMN cash_counts.close_edit_reopened_at IS
  'เวลาที่กดแก้ไขปิดยอดล่าสุด — NOT NULL = กำลังอยู่ในโหมดแก้ไข (ยังไม่ปิดใหม่)';
COMMENT ON COLUMN cash_counts.close_snapshot IS
  'JSON snapshot ก่อนเคลียร์ลิ้นชัก — ใช้คืนยอดเมื่อแก้ไขปิดยอด';


-- 2) ประวัติ event ปิด/เปิดแก้ไข (แสดงในหน้าประวัติปิดยอด)
CREATE TABLE IF NOT EXISTS cash_count_close_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cash_count_id UUID NOT NULL REFERENCES cash_counts(id) ON DELETE CASCADE,
  count_date DATE NOT NULL,
  event_type VARCHAR(20) NOT NULL
    CHECK (event_type IN ('close', 'reopen_edit', 'close_after_edit')),
  close_edit_generation INT NOT NULL DEFAULT 0,
  expected_balance DECIMAL(12,2),
  actual_balance DECIMAL(12,2),
  variance DECIMAL(12,2),
  closing_cash DECIMAL(12,2),
  clear_drawer_amount DECIMAL(12,2),
  clear_drawer_withdrawal_id UUID,
  note TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_events_org_date
  ON cash_count_close_events (organization_id, count_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cc_events_count
  ON cash_count_close_events (cash_count_id, created_at DESC);

COMMENT ON TABLE cash_count_close_events IS
  'ประวัติปิดยอด / แก้ไขปิดยอด — แสดง badge ในหน้าประวัติปิดยอด';


-- 3) audit_logs — ทำเครื่องหมายรายการที่เกิดระหว่างแก้ไขปิดยอด
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS close_edit_generation INT;

COMMENT ON COLUMN audit_logs.close_edit_generation IS
  'ถ้า NOT NULL = รายการนี้เกิดระหว่างรอบแก้ไขปิดยอด (generation ตรงกับ cash_counts)';

CREATE INDEX IF NOT EXISTS idx_audit_close_edit
  ON audit_logs (organization_id, close_edit_generation, created_at DESC)
  WHERE close_edit_generation IS NOT NULL;


-- 4) RPC: เปิดแก้ไขปิดยอด (วันนี้เท่านั้น, ต้องปิดแล้ว)
CREATE OR REPLACE FUNCTION fn_reopen_close_for_edit(
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
  v_snapshot JSONB;
  v_drawer_id UUID;
  v_drawer_amt NUMERIC := 0;
  v_gen INT;
  v_restored_closing NUMERIC;
BEGIN
  v_today := (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE;

  IF p_count_date IS NULL THEN
    p_count_date := v_today;
  END IF;

  IF p_count_date <> v_today THEN
    RAISE EXCEPTION 'แก้ไขปิดยอดได้เฉพาะวันนี้ (% )', v_today;
  END IF;

  SELECT * INTO v_row FROM cash_counts
  WHERE organization_id = p_organization_id
    AND count_date = p_count_date
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ไม่พบ cash_counts สำหรับ %', p_count_date;
  END IF;

  IF v_row.closed_at IS NULL THEN
    RETURN jsonb_build_object(
      'already_open', true,
      'count_date', p_count_date
    );
  END IF;

  IF v_row.close_edit_reopened_at IS NOT NULL THEN
    RAISE EXCEPTION 'อยู่ในโหมดแก้ไขปิดยอดอยู่แล้ว — ปิดยอดใหม่เมื่อแก้ไขเสร็จ';
  END IF;

  v_snapshot := v_row.close_snapshot;
  v_gen := COALESCE(v_row.close_edit_generation, 0);

  -- ลบถอนเคลียร์ลิ้นชัก (จาก id ใน snapshot หรือจาก note)
  IF v_snapshot ? 'clearDrawerWithdrawalId' THEN
    v_drawer_id := (v_snapshot->>'clearDrawerWithdrawalId')::UUID;
    IF v_drawer_id IS NOT NULL THEN
      DELETE FROM cash_withdrawals WHERE id = v_drawer_id;
    END IF;
  END IF;

  DELETE FROM cash_withdrawals
  WHERE organization_id = p_organization_id
    AND withdrawal_date = p_count_date
    AND note = 'เคลียร์ลิ้นชักประจำวัน';

  -- คืนยอดจาก snapshot (ก่อนเคลียร์) หรือคำนวณใหม่
  IF v_snapshot IS NOT NULL AND v_snapshot ? 'closingCash' THEN
    v_restored_closing := (v_snapshot->>'closingCash')::NUMERIC;
  ELSE
    v_restored_closing := COALESCE(v_row.expected_balance, 0);
  END IF;

  IF v_snapshot ? 'clearDrawerAmount' THEN
    v_drawer_amt := (v_snapshot->>'clearDrawerAmount')::NUMERIC;
  END IF;

  UPDATE cash_counts SET
    closed_at = NULL,
    closing_type = NULL,
    close_edit_reopened_at = NOW(),
    expected_balance = COALESCE((v_snapshot->>'expectedBalance')::NUMERIC, v_row.expected_balance),
    actual_balance = COALESCE((v_snapshot->>'actualBalance')::NUMERIC, v_row.actual_balance),
    variance = COALESCE((v_snapshot->>'variance')::NUMERIC, v_row.variance),
    status = COALESCE(v_snapshot->>'status', v_row.status),
    closing_cash = v_restored_closing,
    cash_income = COALESCE((v_snapshot->>'cashIncome')::NUMERIC, cash_income),
    cash_expense = COALESCE((v_snapshot->>'cashExpense')::NUMERIC, cash_expense),
    cash_withdrawn = COALESCE((v_snapshot->>'cashWithdrawn')::NUMERIC, cash_withdrawn),
    transfer_income = COALESCE((v_snapshot->>'transferIncome')::NUMERIC, transfer_income),
    transfer_expense = COALESCE((v_snapshot->>'transferExpense')::NUMERIC, transfer_expense),
    closing_transfer = COALESCE((v_snapshot->>'closingTransfer')::NUMERIC, closing_transfer),
    total_income = COALESCE((v_snapshot->>'totalIncome')::NUMERIC, total_income),
    total_expense = COALESCE((v_snapshot->>'totalExpense')::NUMERIC, total_expense),
    net_total = COALESCE((v_snapshot->>'netTotal')::NUMERIC, net_total),
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = v_row.id;

  INSERT INTO cash_count_close_events (
    organization_id, cash_count_id, count_date, event_type,
    close_edit_generation, expected_balance, actual_balance, variance,
    closing_cash, clear_drawer_amount, clear_drawer_withdrawal_id, user_id
  ) VALUES (
    p_organization_id, v_row.id, p_count_date, 'reopen_edit',
    v_gen,
    COALESCE((v_snapshot->>'expectedBalance')::NUMERIC, v_row.expected_balance),
    COALESCE((v_snapshot->>'actualBalance')::NUMERIC, v_row.actual_balance),
    COALESCE((v_snapshot->>'variance')::NUMERIC, v_row.variance),
    v_restored_closing,
    v_drawer_amt,
    v_drawer_id,
    p_user_id
  );

  RETURN jsonb_build_object(
    'reopened_for_edit', true,
    'count_date', p_count_date,
    'close_edit_generation', v_gen,
    'restored_closing_cash', v_restored_closing
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_reopen_close_for_edit(UUID, DATE, UUID)
  TO anon, authenticated, service_role;


-- 5) Helper: บันทึก event ตอนปิดยอด (แอปเรียกหลัง clearDrawerAndCloseDay)
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
    close_edit_generation, expected_balance, actual_balance, variance,
    closing_cash, clear_drawer_amount, clear_drawer_withdrawal_id, note, user_id
  ) VALUES (
    v_row.organization_id, v_row.id, v_row.count_date, p_event_type,
    COALESCE(v_row.close_edit_generation, 0),
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


-- 6) RLS — อ่าน/เขียน event ผ่านแอป (anon key)
ALTER TABLE cash_count_close_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all close events" ON cash_count_close_events;
CREATE POLICY "Allow all close events" ON cash_count_close_events
  FOR ALL USING (true) WITH CHECK (true);
