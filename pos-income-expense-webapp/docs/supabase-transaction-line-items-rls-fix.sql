-- ============================================================
-- Fix: RLS policy สำหรับ transaction_line_items
-- รันใน Supabase SQL Editor ถ้าบันทึกแล้ว error 500 / 42501
-- ============================================================

ALTER TABLE transaction_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON transaction_line_items;
CREATE POLICY "Allow all" ON transaction_line_items FOR ALL USING (true) WITH CHECK (true);
