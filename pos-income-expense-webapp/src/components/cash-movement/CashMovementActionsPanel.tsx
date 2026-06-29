"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CashDepositDialog } from "@/components/settings/CashDepositDialog";
import { CashWithdrawDialog } from "@/components/settings/CashWithdrawDialog";
import { PinPadDialog, type PinCompleteResult } from "@/components/settings/PinPadDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { verifyDrawerPin } from "@/lib/hardware/drawerPinStorage";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

type PinMode = "cash-deposit" | "cash-withdraw" | null;

interface CashMovementActionsPanelProps {
  onMovementSaved?: () => void;
  disabled?: boolean;
  /** ข้อความเมื่อ disabled — เช่น ปิดยอดแล้ว */
  disabledReason?: string;
}

export function CashMovementActionsPanel({
  onMovementSaved,
  disabled = false,
  disabledReason,
}: CashMovementActionsPanelProps) {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>(null);
  const [pinTitle, setPinTitle] = useState("");
  const [pinSubtitle, setPinSubtitle] = useState<string | undefined>();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const closePin = useCallback(() => {
    setPinMode(null);
    setError(null);
  }, []);

  const startCashDeposit = () => {
    if (disabled) return;
    setError(null);
    setPinTitle("ใส่รหัสเปิดลิ้นชัก");
    setPinSubtitle("ยืนยันก่อนฝากเงินสด — รหัส 4 หลัก");
    setPinMode("cash-deposit");
  };

  const startCashWithdraw = () => {
    if (disabled) return;
    setError(null);
    setPinTitle("ใส่รหัสเปิดลิ้นชัก");
    setPinSubtitle("ยืนยันก่อนถอนเงินสด — รหัส 4 หลัก");
    setPinMode("cash-withdraw");
  };

  const handlePinComplete = (pin: string): PinCompleteResult => {
    if (!verifyDrawerPin(pin)) {
      setError("รหัสไม่ถูกต้อง");
      return false;
    }
    closePin();
    if (pinMode === "cash-deposit") {
      setDepositOpen(true);
      return;
    }
    if (pinMode === "cash-withdraw") {
      setWithdrawOpen(true);
    }
  };

  const handleDepositSaved = () => {
    setDepositOpen(false);
    onMovementSaved?.();
  };

  const handleWithdrawSaved = () => {
    setWithdrawOpen(false);
    onMovementSaved?.();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="income"
          size="lg"
          className="gap-2"
          onClick={startCashDeposit}
          disabled={disabled}
        >
          <ArrowDownToLine size={20} />
          ฝากเงินสด
        </Button>
        <Button
          type="button"
          variant="danger"
          size="lg"
          className="gap-2"
          onClick={startCashWithdraw}
          disabled={disabled}
        >
          <ArrowUpFromLine size={20} />
          ถอนเงินสด
        </Button>
      </div>
      {disabled && disabledReason ? (
        <p className="rounded-xl bg-surface-inset px-4 py-3 text-sm font-bold text-text-muted">
          {disabledReason}
        </p>
      ) : (
        <p className="text-xs text-text-muted">
          ไม่นับเป็นรายรับ–รายจ่ายธุรกิจ · ใส่รหัสเปิดลิ้นชักก่อนทำรายการ (ตั้งรหัสได้ที่ ตั้งค่า)
        </p>
      )}

      {error && !pinMode && (
        <p className="text-sm font-medium text-expense" role="alert">
          {error}
        </p>
      )}

      <PinPadDialog
        key={pinMode ?? "closed"}
        open={pinMode !== null}
        title={pinTitle}
        subtitle={pinSubtitle}
        error={error}
        onComplete={handlePinComplete}
        onCancel={closePin}
      />

      <CashDepositDialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSaved={handleDepositSaved}
        recordedBy={session?.userId}
      />

      <CashWithdrawDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSaved={handleWithdrawSaved}
        recordedBy={session?.userId}
      />
    </div>
  );
}
