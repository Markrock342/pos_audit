-- ============================================================
-- Admin RPC: ลบประวัติฝากเงินสด (ข้าม RLS DELETE = false)
-- Run ครั้งเดียวใน Supabase → SQL Editor
-- จากนั้น: npm run db:clear
-- ============================================================

CREATE OR REPLACE FUNCTION fn_admin_clear_cash_deposits(
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposits INT := 0;
BEGIN
  IF p_organization_id IS NULL THEN
    DELETE FROM cash_deposits WHERE true;
  ELSE
    DELETE FROM cash_deposits WHERE organization_id = p_organization_id;
  END IF;
  GET DIAGNOSTICS v_deposits = ROW_COUNT;

  RETURN jsonb_build_object(
    'cash_deposits_deleted', v_deposits,
    'organization_id', p_organization_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_admin_clear_cash_deposits(UUID) TO anon, authenticated, service_role;
