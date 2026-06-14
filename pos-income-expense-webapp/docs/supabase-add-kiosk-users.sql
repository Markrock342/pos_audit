-- (legacy) เพิ่ม/อัปเดต user kiosk — ปกติ login ครั้งแรกจะ sync อัตโนมัติแล้ว
-- รันใน Supabase Dashboard → SQL Editor ถ้าต้องการอัปเดตชื่อด้วยมือ

INSERT INTO users (id, organization_id, name, email, role, is_active) VALUES
(
  '33333333-3333-3333-3333-333333333334',
  '11111111-1111-1111-1111-111111111111',
  'พีรภัทร (ร้าน)',
  'peeraphat@shop.local',
  'admin',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
