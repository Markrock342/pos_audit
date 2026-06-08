-- ============================================================
-- Migration: transaction_line_items (หลายรายการต่อ 1 ใบ)
-- รันใน Supabase SQL Editor หลัง schema หลัก
-- ============================================================

CREATE TABLE IF NOT EXISTS transaction_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  line_amount DECIMAL(12,2) NOT NULL CHECK (line_amount > 0),
  category_id UUID NOT NULL REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_items_txn ON transaction_line_items (transaction_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_line_items_category ON transaction_line_items (category_id);

COMMENT ON TABLE transaction_line_items IS 'รายการย่อยต่อ 1 ใบ — qty × unit_price = line_amount';

-- RLS (ต้องมี policy — ไม่งั้น insert จะ error 42501)
ALTER TABLE transaction_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON transaction_line_items;
CREATE POLICY "Allow all" ON transaction_line_items FOR ALL USING (true) WITH CHECK (true);

-- แปลงข้อมูลเก่า (1 รายการ = 1 บรรทัด qty 1)
INSERT INTO transaction_line_items (transaction_id, sort_order, title, quantity, unit_price, line_amount, category_id)
SELECT
  t.id,
  0,
  t.title,
  1,
  t.amount,
  t.amount,
  t.category_id
FROM transactions t
WHERE NOT EXISTS (
  SELECT 1 FROM transaction_line_items li WHERE li.transaction_id = t.id
);
