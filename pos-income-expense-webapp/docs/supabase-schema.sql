-- ============================================================
-- Supabase Schema — ระบบบันทึกรายรับ-รายจ่าย
-- Database: PostgreSQL (via Supabase)
-- ============================================================
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → New query → วางโค้ดนี้ → Run

-- 1. องค์กร / ร้านค้า
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',
  receipt_config JSONB DEFAULT '{}',
  hardware_config JSONB DEFAULT '{}',
  finance_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'ข้อมูลองค์กร/ร้านค้า — รวม settings (receipt_config, hardware_config)';

-- 2. ผู้ใช้งาน
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE users IS 'ผู้ใช้งาน — MVP 1 คน (role=admin)';

-- 3. หมวดหมู่ รายรับ / รายจ่าย
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  color VARCHAR(7),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, type, name)
);

COMMENT ON TABLE categories IS 'หมวดหมู่รายรับ/รายจ่าย — แยก income/expense ห้ามซ้ำชื่อ';

-- 4. รายรับ-รายจ่าย (หัวใจของระบบ)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
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
  voided_by UUID,
  receipt_no VARCHAR(100),
  is_printed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ
);

COMMENT ON TABLE transactions IS 'รายรับ-รายจ่ายทุกบรรทัด — หัวใจของระบบ';

-- Index สำหรับรายงาน
CREATE INDEX idx_txn_org_date ON transactions (organization_id, transaction_date);
CREATE INDEX idx_txn_org_type_date ON transactions (organization_id, type, transaction_date);
CREATE INDEX idx_txn_category ON transactions (category_id);
CREATE INDEX idx_txn_org_status ON transactions (organization_id, status);

-- 5. การนับเงินสดประจำวัน (ตรวจสอบยอดขาด/เกิน)
CREATE TABLE cash_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  counted_by UUID,
  count_date DATE NOT NULL,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  variance DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL CHECK (status IN ('balanced','short','overage')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cash_counts IS 'การนับเงินสด — ตรวจสอบยอดขาด/เกิน (variance = actual - expected)';

CREATE INDEX idx_cc_org_date ON cash_counts (organization_id, count_date DESC);

-- 6. ประวัติแก้ไข / ยกเลิกรายการ (audit trail)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('transaction', 'category')),
  entity_id UUID NOT NULL,
  transaction_type VARCHAR(10) CHECK (transaction_type IS NULL OR transaction_type IN ('income', 'expense')),
  entity_title TEXT,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'void')),
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) > 0),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'ประวัติแก้ไข/ยกเลิกรายการ — หน้าประวัติการทำรายการ';

CREATE INDEX idx_audit_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_org_action ON audit_logs (organization_id, action, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_org_txn_type ON audit_logs (organization_id, transaction_type, created_at DESC)
  WHERE transaction_type IS NOT NULL;

-- ============================================================
-- Row Level Security (RLS) — ปิดไว้ก่อน เปิดตอน production
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ตัวอย่าง Policy (MVP: อนุญาตทุกการทำงานก่อน)
CREATE POLICY "Allow all" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cash_counts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
