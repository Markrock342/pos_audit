-- ============================================================
-- Admin RPC: เปิดยอดวันที่ปิดแล้ว (ข้าม RLS UPDATE บน closed_at)
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → Run (ครั้งเดียว)
-- จากนั้น: npm run db:reopen-day -- 2026-06-23
--
-- พฤติกรรม:
--   • ลบถอน "เคลียร์ลิ้นชักประจำวัน" ของวันนั้น (ถ้ามี)
--   • คำนวณ ledger ใหม่จาก transactions / ฝาก / ถอน
--   • ตั้ง closed_at = NULL → แก้ไขและปิดยอดใหม่ได้
-- ============================================================

CREATE OR REPLACE FUNCTION fn_admin_reopen_business_day(
  p_organization_id UUID,
  p_count_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row cash_counts%ROWTYPE;
  v_drawer_deleted INT := 0;
  v_cash_in NUMERIC;
  v_cash_out NUMERIC;
  v_xfer_in NUMERIC;
  v_xfer_out NUMERIC;
  v_total_in NUMERIC;
  v_total_out NUMERIC;
  v_withdrawn NUMERIC;
  v_deposited NUMERIC;
  v_closing_cash NUMERIC;
  v_closing_transfer NUMERIC;
  v_status VARCHAR(10);
BEGIN
  SELECT * INTO v_row FROM cash_counts
  WHERE organization_id = p_organization_id
    AND count_date = p_count_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ไม่พบ cash_counts สำหรับ %', p_count_date;
  END IF;

  IF v_row.closed_at IS NULL THEN
    RETURN jsonb_build_object(
      'already_open', true,
      'count_date', p_count_date,
      'organization_id', p_organization_id
    );
  END IF;

  DELETE FROM cash_withdrawals
  WHERE organization_id = p_organization_id
    AND withdrawal_date = p_count_date
    AND note = 'เคลียร์ลิ้นชักประจำวัน';
  GET DIAGNOSTICS v_drawer_deleted = ROW_COUNT;

  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' AND payment_method = 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' AND payment_method = 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' AND payment_method <> 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' AND payment_method <> 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
  INTO v_cash_in, v_cash_out, v_xfer_in, v_xfer_out, v_total_in, v_total_out
  FROM transactions
  WHERE organization_id = p_organization_id
    AND status = 'active'
    AND transaction_date = p_count_date;

  v_withdrawn := fn_cash_withdrawn_total(p_organization_id, p_count_date);
  v_deposited := fn_cash_deposited_total(p_organization_id, p_count_date);
  v_closing_cash := v_row.opening_balance + v_cash_in - v_cash_out - v_withdrawn + v_deposited;
  v_closing_transfer := COALESCE(v_row.opening_transfer, 0) + v_xfer_in - v_xfer_out;

  IF v_closing_cash = 0 THEN
    v_status := 'balanced';
  ELSE
    v_status := 'short';
  END IF;

  UPDATE cash_counts SET
    opening_transfer = COALESCE(v_row.opening_transfer, 0),
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
    actual_balance = 0,
    variance = -v_closing_cash,
    status = v_status,
    has_manual_count = false,
    closed_at = NULL,
    closing_type = NULL,
    auto_closed = false,
    updated_at = NOW()
  WHERE id = v_row.id;

  RETURN jsonb_build_object(
    'reopened', true,
    'count_date', p_count_date,
    'organization_id', p_organization_id,
    'clear_drawer_withdrawals_deleted', v_drawer_deleted,
    'closing_cash', v_closing_cash
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_admin_reopen_business_day(UUID, DATE) TO anon, authenticated, service_role;
