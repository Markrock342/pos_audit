-- ============================================================
-- Migration: cash_counts — ปิดยอดอัตโนมัติ + ล็อกวันเก่า
-- โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
-- ปลอดภัย: ใช้ IF NOT EXISTS / DROP POLICY IF EXISTS — รันซ้ำได้
--
-- สรุปพฤติกรรม:
--   • หนึ่ง org ต่อหนึ่งวัน (count_date) — ไม่ซ้ำ
--   • closed_at IS NULL = ยังแก้ไขได้ (เฉพาะวันปัจจุบัน)
--   • เที่ยงคืน (Asia/Bangkok) → ปิดอัตโนมัติ (pg_cron + lazy ใน API)
--   • ยอดเปิดวันใหม่ = actual ของวันก่อน
--   • ไม่ได้นับเงินจริง → actual = expected + auto_closed = true
-- ============================================================


-- 1) คอลัมน์ใหม่
ALTER TABLE cash_counts
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_closed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS closing_type VARCHAR(10)
    CHECK (closing_type IS NULL OR closing_type IN ('manual', 'auto')),
  ADD COLUMN IF NOT EXISTS has_manual_count BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN cash_counts.closed_at IS 'เวลาปิดยอด — NOT NULL = ล็อก แก้ไข staff ไม่ได้';
COMMENT ON COLUMN cash_counts.auto_closed IS 'true = ปิดอัตโนมัติเที่ยงคืน ไม่ได้นับเงินจริง';
COMMENT ON COLUMN cash_counts.closing_type IS 'manual = staff บันทึก | auto = ระบบตัด 00:00';
COMMENT ON COLUMN cash_counts.has_manual_count IS 'true = staff กดบันทึกปิดยอดอย่างน้อย 1 ครั้งในวันนั้น';

-- 2) หนึ่ง record ต่อ org ต่อวัน
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_counts_org_date
  ON cash_counts (organization_id, count_date);

CREATE INDEX IF NOT EXISTS idx_cc_org_closed
  ON cash_counts (organization_id, closed_at NULLS FIRST, count_date DESC);


-- 3) ฟังก์ชันคำนวณยอดคาดหวัง (ใช้ใน pg_cron)
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
      ), 0);
$$;


-- 4) ปิดยอดวันที่ผ่านมา (เรียกจาก pg_cron ทุก 00:05 Bangkok)
CREATE OR REPLACE FUNCTION fn_auto_close_cash_counts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE;
  v_row RECORD;
  v_expected NUMERIC;
  v_actual NUMERIC;
  v_variance NUMERIC;
  v_status VARCHAR(10);
  v_note TEXT;
  v_opening NUMERIC;
  v_prev_actual NUMERIC;
  v_closed INTEGER := 0;
BEGIN
  v_today := (NOW() AT TIME ZONE 'Asia/Bangkok')::DATE;

  FOR v_row IN
    SELECT cc.*
    FROM cash_counts cc
    WHERE cc.closed_at IS NULL
      AND cc.count_date < v_today
  LOOP
    v_expected := fn_cash_expected_balance(
      v_row.organization_id,
      v_row.count_date,
      v_row.opening_balance
    );

    IF v_row.has_manual_count THEN
      v_actual := v_row.actual_balance;
      v_note := COALESCE(v_row.note, '')
        || CASE WHEN v_row.note IS NULL OR v_row.note = '' THEN '' ELSE ' | ' END
        || 'ปิดอัตโนมัติ — ใช้ยอดที่บันทึกไว้';
    ELSE
      v_actual := v_expected;
      v_note := COALESCE(v_row.note, '')
        || CASE WHEN v_row.note IS NULL OR v_row.note = '' THEN '' ELSE ' | ' END
        || 'ปิดอัตโนมัติ — ไม่ได้นับเงินจริง (ใช้ยอดคาดหวัง)';
    END IF;

    v_variance := v_actual - v_expected;
    IF v_variance = 0 THEN
      v_status := 'balanced';
    ELSIF v_variance < 0 THEN
      v_status := 'short';
    ELSE
      v_status := 'overage';
    END IF;

    UPDATE cash_counts SET
      expected_balance = v_expected,
      actual_balance = v_actual,
      variance = v_variance,
      status = v_status,
      note = NULLIF(TRIM(v_note), ''),
      closed_at = NOW(),
      auto_closed = NOT v_row.has_manual_count,
      closing_type = 'auto',
      updated_at = NOW()
    WHERE id = v_row.id;

    v_closed := v_closed + 1;
  END LOOP;

  -- สร้าง record วันปัจจุบันถ้ายังไม่มี (ยอดเปิด = actual เมื่อวาน)
  FOR v_row IN
    SELECT id AS organization_id FROM organizations
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM cash_counts
      WHERE organization_id = v_row.organization_id
        AND count_date = v_today
    ) THEN
      SELECT cc.actual_balance INTO v_prev_actual
      FROM cash_counts cc
      WHERE cc.organization_id = v_row.organization_id
        AND cc.count_date = v_today - 1
      LIMIT 1;

      v_opening := COALESCE(v_prev_actual, 0);
      v_expected := fn_cash_expected_balance(v_row.organization_id, v_today, v_opening);

      INSERT INTO cash_counts (
        organization_id,
        count_date,
        opening_balance,
        expected_balance,
        actual_balance,
        variance,
        status,
        has_manual_count,
        auto_closed,
        closing_type,
        created_at
      ) VALUES (
        v_row.organization_id,
        v_today,
        v_opening,
        v_expected,
        0,
        -v_expected,
        'short',
        false,
        false,
        NULL,
        NOW()
      )
      ON CONFLICT (organization_id, count_date) DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_closed;
END;
$$;


-- 5) pg_cron — รันทุก 00:05 น. ตามเวลาไทย (17:05 UTC = 00:05 ICT)
--    ต้องเปิด extension pg_cron ใน Supabase Dashboard ก่อน (Database → Extensions)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'auto_close_cash_counts_bkk';

    PERFORM cron.schedule(
      'auto_close_cash_counts_bkk',
      '5 17 * * *',
      $$SELECT fn_auto_close_cash_counts();$$
    );
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_cron not available — ใช้ lazy close ใน API แทน';
END;
$cron$;


-- 6) RLS — แทน policy เดิมบน cash_counts
ALTER TABLE cash_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON cash_counts;
DROP POLICY IF EXISTS "cash_counts_select" ON cash_counts;
DROP POLICY IF EXISTS "cash_counts_insert" ON cash_counts;
DROP POLICY IF EXISTS "cash_counts_update_open" ON cash_counts;
DROP POLICY IF EXISTS "cash_counts_delete" ON cash_counts;

-- อ่านได้ทุก record (MVP — anon key จาก Next.js API)
CREATE POLICY "cash_counts_select"
  ON cash_counts FOR SELECT
  USING (true);

-- สร้างได้เฉพาะวันที่ยังไม่มี record (unique index กันอยู่แล้ว)
CREATE POLICY "cash_counts_insert"
  ON cash_counts FOR INSERT
  WITH CHECK (closed_at IS NULL);

-- แก้ไขได้เฉพาะที่ยังไม่ปิด — WITH CHECK (true) ให้ตั้ง closed_at ตอนปิดยอดได้
CREATE POLICY "cash_counts_update_open"
  ON cash_counts FOR UPDATE
  USING (closed_at IS NULL)
  WITH CHECK (true);

-- ลบ — MVP ไม่ให้ลบจาก client (ใช้ service role ถ้าจำเป็น)
CREATE POLICY "cash_counts_delete"
  ON cash_counts FOR DELETE
  USING (false);


-- 7) Admin แก้ไขวันที่ปิดแล้ว — เรียกผ่าน RPC (SECURITY DEFINER ข้าม RLS)
CREATE OR REPLACE FUNCTION fn_admin_update_cash_count(
  p_id UUID,
  p_opening_balance NUMERIC,
  p_actual_balance NUMERIC,
  p_note TEXT,
  p_updated_by UUID
) RETURNS SETOF cash_counts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row cash_counts%ROWTYPE;
  v_expected NUMERIC;
  v_variance NUMERIC;
  v_status VARCHAR(10);
BEGIN
  SELECT * INTO v_row FROM cash_counts WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cash count not found';
  END IF;

  v_expected := fn_cash_expected_balance(
    v_row.organization_id,
    v_row.count_date,
    p_opening_balance
  );
  v_variance := p_actual_balance - v_expected;
  IF v_variance = 0 THEN v_status := 'balanced';
  ELSIF v_variance < 0 THEN v_status := 'short';
  ELSE v_status := 'overage';
  END IF;

  RETURN QUERY
  UPDATE cash_counts SET
    opening_balance = p_opening_balance,
    actual_balance = p_actual_balance,
    expected_balance = v_expected,
    variance = v_variance,
    status = v_status,
    note = p_note,
    has_manual_count = true,
    updated_at = NOW(),
    updated_by = p_updated_by
  WHERE id = p_id
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_auto_close_cash_counts() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_admin_update_cash_count(UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_cash_expected_balance(UUID, DATE, NUMERIC) TO anon, authenticated, service_role;
