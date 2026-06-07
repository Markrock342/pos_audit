import { APP_NAME, SHOP_NAME } from "@/constants";
import { PinLogin } from "@/components/forms/PinLogin";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
      {/* Logo Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand shadow-[0_4px_16px_rgba(255,107,53,0.4)]">
          <span className="text-4xl font-black text-text-inverse">บ</span>
        </div>
        <p className="text-lg font-bold uppercase tracking-widest text-text-muted">
          {SHOP_NAME}
        </p>
        <h1 className="mt-1 text-4xl font-black text-text-main tracking-tight">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-lg text-text-secondary font-semibold">
          กรอกชื่อผู้ใช้และ PIN 4 หลัก
        </p>
      </div>

      {/* Login Area */}
      <div className="w-full max-w-md">
        <PinLogin />
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-base font-bold text-text-muted">
        Kiosk Mode — ระบบบันทึกรายรับ-รายจ่าย
      </p>
    </div>
  );
}
