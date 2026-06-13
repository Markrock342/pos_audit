-- ============================================================
-- Migration: cash_withdrawals — ถอนเงินสดออกจาก POS
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
-- ปลอดภัย: IF NOT EXISTS — รันซ้ำได้
--
-- พฤติกรรม:
--   • บันทึกเงินสดที่นำออกจาก POS (ไม่เปิดลิ้นชัก)
--   • ลดยอดคาดหวังเงินสด — ไม่กระทบยอดโอน / ไม่นับเป็นรายจ่ายธุรกิจ
--   • หมายเหตุบังคับ (เช่น นำไปฝากธนาคาร)
-- ============================================================

CREATE TABLE IF NOT EXISTS cash_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  withdrawal_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL CHECK (char_length(trim(note)) > 0),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cash_withdrawals IS 'ถอนเงินสดออกจาก POS — ไม่ใช่รายจ่ายธุรกิจ ไม่กระทบยอดโอน';

CREATE INDEX IF NOT EXISTS idx_cw_org_date
  ON cash_withdrawals (organization_id, withdrawal_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cw_org_created
  ON cash_withdrawals (organization_id, created_at DESC);


-- อัปเดต fn คำนวณยอดสด — หักถอนออกด้วย (ใช้ตอนปิดยอด 00:00)
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
      ), 0);
$$;


-- RLS (MVP — อ่าน/สร้างผ่าน Next.js API)
ALTER TABLE cash_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_withdrawals_select" ON cash_withdrawals;
DROP POLICY IF EXISTS "cash_withdrawals_insert" ON cash_withdrawals;
DROP POLICY IF EXISTS "cash_withdrawals_update" ON cash_withdrawals;
DROP POLICY IF EXISTS "cash_withdrawals_delete" ON cash_withdrawals;

CREATE POLICY "cash_withdrawals_select"
  ON cash_withdrawals FOR SELECT
  USING (true);

CREATE POLICY "cash_withdrawals_insert"
  ON cash_withdrawals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "cash_withdrawals_update"
  ON cash_withdrawals FOR UPDATE
  USING (false);

CREATE POLICY "cash_withdrawals_delete"
  ON cash_withdrawals FOR DELETE
  USING (false);

GRANT SELECT, INSERT ON cash_withdrawals TO anon, authenticated, service_role;
