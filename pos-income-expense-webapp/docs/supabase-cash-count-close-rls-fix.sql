-- ============================================================
-- Fix: RLS บล็อกการปิดยอด (ตั้ง closed_at ไม่ได้ → API 500)
-- รันหลัง supabase-cash-count-close.sql
-- ============================================================
--
-- สาเหตุ: policy เดิม WITH CHECK (closed_at IS NULL) ห้าม UPDATE ที่ใส่ closed_at
-- ผล: วันที่ 8 ปิดไม่ได้ → วันที่ 9 สร้างไม่ครบ → หน้าค้าง + error 500
--
-- วิธีใช้: SQL Editor → วางทั้งไฟล์ → Run
-- จากนั้น (ถ้าค้างวันเก่า): SELECT fn_auto_close_cash_counts();
-- ============================================================


-- 1) แก้ policy UPDATE — อนุญาตปิดยอด (ตั้ง closed_at ได้)
DROP POLICY IF EXISTS "cash_counts_update_open" ON cash_counts;

CREATE POLICY "cash_counts_update_open"
  ON cash_counts FOR UPDATE
  USING (closed_at IS NULL)
  WITH CHECK (true);


-- 2) ให้ fn ปิดยอดรันได้แม้ผ่าน anon/API (SECURITY DEFINER)
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

GRANT EXECUTE ON FUNCTION fn_auto_close_cash_counts() TO anon, authenticated, service_role;


-- 3) ปิดวันค้างทันที (รันครั้งเดียวหลัง fix)
SELECT fn_auto_close_cash_counts();
