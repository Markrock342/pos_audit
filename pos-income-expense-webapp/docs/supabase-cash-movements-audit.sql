-- Migration: ขยาย audit_logs สำหรับ cash_withdrawal (และ cash_deposit)
-- รันหลัง supabase-audit-logs.sql และ supabase-cash-deposits.sql (ถ้ามีแล้ว)

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_entity_type_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_entity_type_check
  CHECK (entity_type IN ('transaction', 'category', 'cash_deposit', 'cash_withdrawal'));
