-- ============================================================
-- Admin RPC: ลบประวัติปิดยอด + ถอนเงินสด (ข้าม RLS DELETE policy)
-- โปรเจกต์: สมุดรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้: Supabase Dashboard → SQL Editor → Run (ครั้งเดียว)
-- จากนั้นรัน: npm run db:clear-daily-close
--
-- หมายเหตุ: cash_counts / cash_withdrawals มี RLS DELETE = false
--           จึงลบผ่าน anon key ไม่ได้ — ต้องใช้ RPC นี้หรือ service role
-- ============================================================

CREATE OR REPLACE FUNCTION fn_admin_clear_daily_close(
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawals INT := 0;
  v_counts INT := 0;
BEGIN
  IF p_organization_id IS NULL THEN
    DELETE FROM cash_withdrawals;
    GET DIAGNOSTICS v_withdrawals = ROW_COUNT;
    DELETE FROM cash_counts;
    GET DIAGNOSTICS v_counts = ROW_COUNT;
  ELSE
    DELETE FROM cash_withdrawals WHERE organization_id = p_organization_id;
    GET DIAGNOSTICS v_withdrawals = ROW_COUNT;
    DELETE FROM cash_counts WHERE organization_id = p_organization_id;
    GET DIAGNOSTICS v_counts = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'cash_withdrawals_deleted', v_withdrawals,
    'cash_counts_deleted', v_counts,
    'organization_id', p_organization_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_admin_clear_daily_close(UUID) TO anon, authenticated, service_role;
