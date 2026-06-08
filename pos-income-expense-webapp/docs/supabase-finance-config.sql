-- เพิ่มคอลัมน์ finance_config สำหรับยอดเงินยกมา (เงินสด / เงินเก็บ)
-- รันใน Supabase SQL Editor ครั้งเดียว (ถ้า DB สร้างก่อนหน้านี้แล้ว)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS finance_config JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN organizations.finance_config IS 'การเงิน — ยอดยกมาเงินสด/เงินเก็บ ต้นเดือน (openingCashBalance, openingSavingsBalance, openingBalanceMonth)';
