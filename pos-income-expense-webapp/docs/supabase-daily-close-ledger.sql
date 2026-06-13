-- ============================================================
-- Migration: daily close ledger snapshot on cash_counts
-- โปรเจกต์: สมุดรายรับ-รายจ่าย — Phase 3
-- ============================================================
--
-- วิธีใช้: Supabase SQL Editor → Run (หลัง supabase-cash-withdrawals.sql)
-- ปลอดภัย: IF NOT EXISTS — รันซ้ำได้
--
-- พฤติกรรม:
--   • เก็บ snapshot สด + โอน + สรุปธุรกิจ ต่อวัน
--   • 00:00 → ปิดวัน + ยก closing → opening วันถัดไป
-- ============================================================

ALTER TABLE cash_counts
  ADD COLUMN IF NOT EXISTS opening_transfer DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_expense DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_withdrawn DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_expense DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_transfer DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_expense DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_total DECIMAL(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN cash_counts.opening_transfer IS 'ยอดเปิดโอน (สมุด) วันนี้';
COMMENT ON COLUMN cash_counts.closing_cash IS 'ยอดคงเหลือเงินสดใน POS ณ ปิดวัน / real-time';
COMMENT ON COLUMN cash_counts.closing_transfer IS 'ยอดคงเหลือโอน (สมุด) ณ ปิดวัน / real-time';


CREATE OR REPLACE FUNCTION fn_cash_withdrawn_total(
  p_org_id UUID,
  p_count_date DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((
    SELECT SUM(amount) FROM cash_withdrawals
    WHERE organization_id = p_org_id
      AND withdrawal_date = p_count_date
  ), 0);
$$;


CREATE OR REPLACE FUNCTION fn_transfer_opening_balance(
  p_org_id UUID,
  p_count_date DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_row cash_counts%ROWTYPE;
  v_prev cash_counts%ROWTYPE;
  v_finance JSONB;
  v_month TEXT;
  v_month_start DATE;
  v_yesterday DATE;
  v_opening NUMERIC := 0;
BEGIN
  SELECT * INTO v_row FROM cash_counts
  WHERE organization_id = p_org_id AND count_date = p_count_date
  LIMIT 1;

  IF FOUND THEN
    RETURN v_row.opening_transfer;
  END IF;

  v_yesterday := p_count_date - 1;
  SELECT * INTO v_prev FROM cash_counts
  WHERE organization_id = p_org_id
    AND count_date = v_yesterday
    AND closed_at IS NOT NULL
  LIMIT 1;

  IF FOUND THEN
    RETURN COALESCE(v_prev.closing_transfer, 0);
  END IF;

  SELECT finance_config INTO v_finance FROM organizations WHERE id = p_org_id;
  v_month := COALESCE(v_finance->>'openingBalanceMonth', to_char(p_count_date, 'YYYY-MM'));
  v_month_start := (v_month || '-01')::DATE;

  IF p_count_date >= v_month_start THEN
    v_opening := COALESCE((v_finance->>'openingSavingsBalance')::NUMERIC, 0);
  END IF;

  IF v_yesterday >= v_month_start THEN
    v_opening := v_opening
      + COALESCE((
          SELECT SUM(amount) FROM transactions
          WHERE organization_id = p_org_id
            AND status = 'active'
            AND type = 'income'
            AND payment_method <> 'cash'
            AND transaction_date >= v_month_start
            AND transaction_date <= v_yesterday
        ), 0)
      - COALESCE((
          SELECT SUM(amount) FROM transactions
          WHERE organization_id = p_org_id
            AND status = 'active'
            AND type = 'expense'
            AND payment_method <> 'cash'
            AND transaction_date >= v_month_start
            AND transaction_date <= v_yesterday
        ), 0);
  END IF;

  RETURN v_opening;
END;
$$;


CREATE OR REPLACE FUNCTION fn_apply_daily_ledger_snapshot(
  p_org_id UUID,
  p_count_date DATE,
  p_opening_cash NUMERIC,
  p_opening_transfer NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_cash_in NUMERIC;
  v_cash_out NUMERIC;
  v_xfer_in NUMERIC;
  v_xfer_out NUMERIC;
  v_total_in NUMERIC;
  v_total_out NUMERIC;
  v_withdrawn NUMERIC;
  v_closing_cash NUMERIC;
  v_closing_transfer NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' AND payment_method = 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' AND payment_method = 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' AND payment_method <> 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' AND payment_method <> 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
  INTO v_cash_in, v_cash_out, v_xfer_in, v_xfer_out, v_total_in, v_total_out
  FROM transactions
  WHERE organization_id = p_org_id
    AND status = 'active'
    AND transaction_date = p_count_date;

  v_withdrawn := fn_cash_withdrawn_total(p_org_id, p_count_date);
  v_closing_cash := p_opening_cash + v_cash_in - v_cash_out - v_withdrawn;
  v_closing_transfer := p_opening_transfer + v_xfer_in - v_xfer_out;

  UPDATE cash_counts SET
    opening_transfer = p_opening_transfer,
    cash_income = v_cash_in,
    cash_expense = v_cash_out,
    cash_withdrawn = v_withdrawn,
    closing_cash = v_closing_cash,
    transfer_income = v_xfer_in,
    transfer_expense = v_xfer_out,
    closing_transfer = v_closing_transfer,
    total_income = v_total_in,
    total_expense = v_total_out,
    net_total = v_total_in - v_total_out,
    expected_balance = v_closing_cash,
    updated_at = NOW()
  WHERE organization_id = p_org_id
    AND count_date = p_count_date;
END;
$$;


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
  v_opening_cash NUMERIC;
  v_opening_transfer NUMERIC;
  v_prev cash_counts%ROWTYPE;
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
    IF v_variance = 0 THEN v_status := 'balanced';
    ELSIF v_variance < 0 THEN v_status := 'short';
    ELSE v_status := 'overage';
    END IF;

    PERFORM fn_apply_daily_ledger_snapshot(
      v_row.organization_id,
      v_row.count_date,
      v_row.opening_balance,
      COALESCE(v_row.opening_transfer, fn_transfer_opening_balance(v_row.organization_id, v_row.count_date))
    );

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
      SELECT * INTO v_prev FROM cash_counts
      WHERE organization_id = v_row.organization_id
        AND count_date = v_today - 1
      LIMIT 1;

      v_opening_cash := COALESCE(v_prev.closing_cash, v_prev.actual_balance, 0);
      v_opening_transfer := COALESCE(v_prev.closing_transfer, fn_transfer_opening_balance(v_row.organization_id, v_today));
      v_expected := fn_cash_expected_balance(v_row.organization_id, v_today, v_opening_cash);

      INSERT INTO cash_counts (
        organization_id,
        count_date,
        opening_balance,
        opening_transfer,
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
        v_opening_cash,
        v_opening_transfer,
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

      PERFORM fn_apply_daily_ledger_snapshot(
        v_row.organization_id,
        v_today,
        v_opening_cash,
        v_opening_transfer
      );
    END IF;
  END LOOP;

  RETURN v_closed;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_cash_withdrawn_total(UUID, DATE) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_transfer_opening_balance(UUID, DATE) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_apply_daily_ledger_snapshot(UUID, DATE, NUMERIC, NUMERIC) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_auto_close_cash_counts() TO anon, authenticated, service_role;
