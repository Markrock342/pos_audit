import { APP_NAME, SHOP_NAME } from "@/constants";
import { PinLogin } from "@/components/forms/PinLogin";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-surface px-6 py-4">
      {/* Logo Header */}
      <div className="flex flex-col items-center text-center shrink-0">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand shadow-[0_4px_16px_rgba(255,107,53,0.4)]">
          <span className="text-3xl font-black text-text-inverse">บ</span>
        </div>
        <p className="text-base font-bold uppercase tracking-widest text-text-muted">
          {SHOP_NAME}
        </p>
        <h1 className="mt-0.5 text-2xl font-black text-text-main tracking-tight">
          {APP_NAME}
        </h1>
        <p className="mt-1 text-base text-text-secondary font-semibold">
          กรอกชื่อผู้ใช้และ PIN 4 หลัก
        </p>
      </div>

      {/* Login Area */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <PinLogin />
      </div>

      {/* Footer */}
      <p className="text-center text-sm font-bold text-text-muted shrink-0">
        Kiosk Mode — ระบบบันทึกรายรับ-รายจ่าย
      </p>
    </div>
  );
}
