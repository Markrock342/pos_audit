-- ============================================================
-- Migration: cash_deposits — ฝากเงินสดเข้า POS
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase SQL Editor → Run (หลัง supabase-cash-withdrawals.sql)
-- ปลอดภัย: IF NOT EXISTS — รันซ้ำได้
--
-- พฤติกรรม:
--   • เพิ่มเงินสดใน POS (ไม่ใช่รายรับธุรกิจ)
--   • เปิดลิ้นชักหลังบันทึก (ฝั่งแอป)
--   • แสดงในหน้าประวัติรายการ (audit_logs)
-- ============================================================

CREATE TABLE IF NOT EXISTS cash_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  deposit_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cash_deposits IS 'ฝากเงินสดเข้า POS — ไม่ใช่รายรับธุรกิจ ไม่กระทบยอดโอน';

CREATE INDEX IF NOT EXISTS idx_cd_org_date
  ON cash_deposits (organization_id, deposit_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cd_org_created
  ON cash_deposits (organization_id, created_at DESC);


CREATE OR REPLACE FUNCTION fn_cash_deposited_total(
  p_org_id UUID,
  p_count_date DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((
    SELECT SUM(amount) FROM cash_deposits
    WHERE organization_id = p_org_id
      AND deposit_date = p_count_date
  ), 0);
$$;


-- อัปเดต fn คำนวณยอดสด — บวกฝากเข้า หักถอนออก
CREATE OR REPLACE FUNCTION fn_cash_expected_balance(
  p_org_id UUID,
  p_count_date DATE,
  p_opening NUMERIC
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT p_opening
    + COALESCE((
        SELECT SUM(amount) FROM transactions
        WHERE organization_id = p_org_id
          AND status = 'active'
          AND type = 'income'
          AND payment_method = 'cash'
          AND transaction_date = p_count_date
      ), 0)
    - COALESCE((
        SELECT SUM(amount) FROM transactions
        WHERE organization_id = p_org_id
          AND status = 'active'
          AND type = 'expense'
          AND payment_method = 'cash'
          AND transaction_date = p_count_date
      ), 0)
    - COALESCE((
        SELECT SUM(amount) FROM cash_withdrawals
        WHERE organization_id = p_org_id
          AND withdrawal_date = p_count_date
      ), 0)
    + fn_cash_deposited_total(p_org_id, p_count_date);
$$;


-- ขยาย audit_logs ให้รองรับ cash_deposit
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_entity_type_check
  CHECK (entity_type IN ('transaction', 'category', 'cash_deposit', 'cash_withdrawal'));


-- RLS
ALTER TABLE cash_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_deposits_select" ON cash_deposits;
DROP POLICY IF EXISTS "cash_deposits_insert" ON cash_deposits;
DROP POLICY IF EXISTS "cash_deposits_update" ON cash_deposits;
DROP POLICY IF EXISTS "cash_deposits_delete" ON cash_deposits;

CREATE POLICY "cash_deposits_select"
  ON cash_deposits FOR SELECT
  USING (true);

CREATE POLICY "cash_deposits_insert"
  ON cash_deposits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "cash_deposits_update"
  ON cash_deposits FOR UPDATE
  USING (false);

CREATE POLICY "cash_deposits_delete"
  ON cash_deposits FOR DELETE
  USING (false);

GRANT SELECT, INSERT ON cash_deposits TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_cash_deposited_total(UUID, DATE) TO anon, authenticated, service_role;
