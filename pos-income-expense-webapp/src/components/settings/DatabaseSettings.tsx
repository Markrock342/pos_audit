"use client";

export function DatabaseSettings() {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-main">Supabase (ฐานข้อมูลจริง)</p>
      <p className="text-xs text-text-muted">
        ระบบเชื่อมต่อ Supabase โดยตรง — ข้อมูลทั้งหมดมาจากฐานข้อมูล ไม่มี mock
      </p>
      <p className="text-xs text-text-muted">
        ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local
        <br />
        ถ้าใช้ฟีเจอร์ยอดยกมา ให้รัน <code className="text-xs">docs/supabase-finance-config.sql</code> ใน Supabase ด้วย
      </p>
    </div>
  );
}
