-- ============================================================
-- Migration: audit_logs — ประวัติแก้ไข / ยกเลิกรายการ
-- โปรเจกต์: ระบบบันทึกรายรับ-รายจ่าย
-- ============================================================
--
-- วิธีใช้ (DB ที่มีข้อมูลอยู่แล้ว — ไม่ลบตารางเดิม):
--   Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
--
-- ใช้เมื่อ: เพิ่มฟีเจอร์ "หน้าประวัติการทำรายการ"
-- ปลอดภัย: ใช้ IF NOT EXISTS — รันซ้ำได้ (ไม่สร้างซ้ำ)
-- ============================================================


-- 6. ประวัติการแก้ไข / ยกเลิก (audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- อ้างอิง record ที่ถูกกระทำ (transaction, category ฯลฯ)
  entity_type VARCHAR(50) NOT NULL
    CHECK (entity_type IN ('transaction', 'category')),

  entity_id UUID NOT NULL,

  -- denormalized สำหรับหน้าประวัติ (ไม่ต้อง join ทุกครั้ง)
  transaction_type VARCHAR(10)
    CHECK (transaction_type IS NULL OR transaction_type IN ('income', 'expense')),
  entity_title TEXT,

  -- create | update | void  (void = ยกเลิกรายการ — ไม่ hard delete)
  action VARCHAR(20) NOT NULL
    CHECK (action IN ('create', 'update', 'void')),

  -- เหตุผล — บังคับทุกครั้งที่ update / void
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) > 0),

  -- snapshot ค่าก่อน/หลัง (JSON) สำหรับแสดงรายละเอียดการเปลี่ยนแปลง
  old_value JSONB,
  new_value JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'ประวัติแก้ไข/ยกเลิกรายการ — หน้าประวัติการทำรายการ';
COMMENT ON COLUMN audit_logs.reason IS 'เหตุผลที่ผู้ใช้กรอก — บังคับเมื่อ action = update หรือ void';
COMMENT ON COLUMN audit_logs.action IS 'update = แก้ไข, void = ยกเลิก (soft delete), create = สร้าง (optional)';

-- Index สำหรับหน้าประวัติ + filter
CREATE INDEX IF NOT EXISTS idx_audit_org_created
  ON audit_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_org_action
  ON audit_logs (organization_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_org_txn_type
  ON audit_logs (organization_id, transaction_type, created_at DESC)
  WHERE transaction_type IS NOT NULL;


-- Row Level Security (MVP — อนุญาตทั้งหมด เหมือนตารางอื่น)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'Allow all'
  ) THEN
    CREATE POLICY "Allow all" ON audit_logs
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ตรวจสอบหลังรัน
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- คาดหวัง: แสดง 12 columns (id, organization_id, user_id, entity_type, entity_id,
--          transaction_type, entity_title, action, reason, old_value, new_value, created_at)
