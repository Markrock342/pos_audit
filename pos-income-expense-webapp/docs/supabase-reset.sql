-- ============================================================
-- Supabase RESET — ลบทุกตาราง + สร้างใหม่ (ไม่มีข้อมูล mock)
-- โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้:
--   Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
--
-- ผลลัพธ์:
--   - ตารางพร้อมใช้งานจริง
--   - org + user สำหรับ login (lcs / dev)
--   - หมวดหมู่เริ่มต้นว่าง (ลูกค้าเพิ่มเองในหน้า หมวดหมู่)
--   - ไม่มีรายการรายรับ-รายจ่ายตัวอย่าง
-- ============================================================


-- STEP 1: ลบตารางเดิมทั้งหมด
DROP TABLE IF EXISTS cash_counts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;


-- STEP 2: สร้างตาราง
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',
  receipt_config JSONB DEFAULT '{}',
  hardware_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  color VARCHAR(7),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, type, name)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash','transfer','cheque','card','other')),
  reference_no VARCHAR(100),
  transaction_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','void')),
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES users(id),
  receipt_no VARCHAR(100),
  is_printed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_txn_org_date ON transactions (organization_id, transaction_date);
CREATE INDEX idx_txn_org_type_date ON transactions (organization_id, type, transaction_date);
CREATE INDEX idx_txn_category ON transactions (category_id);
CREATE INDEX idx_txn_org_status ON transactions (organization_id, status);

CREATE TABLE cash_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  counted_by UUID REFERENCES users(id),
  count_date DATE NOT NULL,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  variance DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL CHECK (status IN ('balanced','short','overage')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, count_date)
);

CREATE INDEX idx_cc_org_date ON cash_counts (organization_id, count_date DESC);


-- STEP 3: RLS (MVP)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cash_counts FOR ALL USING (true) WITH CHECK (true);


-- STEP 4: ข้อมูลเริ่มต้น (ไม่มีรายการ mock)
INSERT INTO organizations (id, name, tax_id, address, phone, currency, receipt_config, hardware_config) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'บัญชีร้าน',
  NULL,
  NULL,
  NULL,
  'THB',
  '{"header":"บัญชีร้าน","footer":"ขอบคุณที่ใช้บริการ"}',
  '{}'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Sandbox Dev',
  NULL,
  'ทดสอบระบบ — ไม่ใช่ข้อมูลลูกค้า',
  NULL,
  'THB',
  '{"header":"[DEV]","footer":""}',
  '{}'
);

INSERT INTO users (id, organization_id, name, email, role, is_active) VALUES
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ลูกค้า (ร้าน)',
  'customer@shop.local',
  'admin',
  TRUE
),
(
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'ทีมพัฒนา',
  'dev@internal.local',
  'admin',
  TRUE
);

-- หมวดหมู่เริ่มต้น (จำเป็นสำหรับบันทึกรายการ — ไม่ใช่รายการเงิน mock)
INSERT INTO categories (id, organization_id, type, name, color, sort_order, is_active) VALUES
('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111', 'income',  'ค่าสินค้า (ขายวัสดุ/อุปกรณ์)', '#4CAF50', 10, TRUE),
('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111111', 'income',  'ค่าบริการ (จัดสวน/ช่าง)',     '#2196F3', 20, TRUE),
('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111111', 'income',  'เงินสดหน้าร้าน',              '#FF9800', 30, TRUE),
('55555555-5555-5555-5555-555555555504', '11111111-1111-1111-1111-111111111111', 'income',  'รายได้อื่น',                  '#8BC34A', 40, TRUE),
('55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111111', 'expense', 'ค่าแรงงาน',                   '#B22222', 10, TRUE),
('55555555-5555-5555-5555-555555555506', '11111111-1111-1111-1111-111111111111', 'expense', 'ค่าขนส่ง',                    '#6B8E23', 20, TRUE),
('55555555-5555-5555-5555-555555555507', '11111111-1111-1111-1111-111111111111', 'expense', 'ค่าสินค้า (ซื้อเข้า)',         '#4682B4', 30, TRUE),
('55555555-5555-5555-5555-555555555508', '11111111-1111-1111-1111-111111111111', 'expense', 'ค่าเช่า / น้ำ-ไฟ',             '#708090', 40, TRUE),
('55555555-5555-5555-5555-555555555509', '11111111-1111-1111-1111-111111111111', 'expense', 'ค่าใช้จ่ายอื่น',               '#9E9E9E', 50, TRUE);

-- transactions = ว่าง (ลูกค้าบันทึกเอง)
-- cash_counts = ว่าง


-- STEP 5: ตรวจสอบ
-- SELECT 'organizations' AS tbl, COUNT(*) FROM organizations
-- UNION ALL SELECT 'users', COUNT(*) FROM users
-- UNION ALL SELECT 'categories', COUNT(*) FROM categories
-- UNION ALL SELECT 'transactions', COUNT(*) FROM transactions;
-- คาดหวัง: 2, 2, 9, 0
