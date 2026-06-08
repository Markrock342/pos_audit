import { APP_NAME, SHOP_NAME } from "@/constants";
import { PinLogin } from "@/components/forms/PinLogin";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 py-6 overflow-y-auto">
      {/* Logo Header */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-[0_4px_16px_rgba(255,107,53,0.4)]">
          <span className="text-2xl font-black text-text-inverse">บ</span>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-text-muted">
          {SHOP_NAME}
        </p>
        <h1 className="text-xl font-black text-text-main tracking-tight">
          {APP_NAME}
        </h1>
      </div>

      {/* Login Area */}
      <div className="w-full max-w-lg">
        <PinLogin />
      </div>

      {/* Footer */}
      <p className="text-center text-xs font-bold text-text-muted">
        Kiosk Mode — ระบบบันทึกรายรับ-รายจ่าย
      </p>
    </div>
  );
}
