"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CashDepositDialog } from "@/components/settings/CashDepositDialog";
import { CashWithdrawDialog } from "@/components/settings/CashWithdrawDialog";
import { PinPadDialog } from "@/components/settings/PinPadDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { openCashDrawer } from "@/lib/hardware/cashDrawer";
import {
  DRAWER_PIN_STORAGE_KEY,
  setDrawerPin,
  verifyDrawerPin,
} from "@/lib/hardware/drawerPinStorage";
import { printTestPage } from "@/lib/hardware/testPrint";
import { ArrowDownToLine, ArrowUpFromLine, Lock, Printer, Wallet } from "lucide-react";

type PinMode =
  | "open-drawer"
  | "cash-deposit"
  | "cash-withdraw"
  | "change-current"
  | "change-new"
  | "change-confirm"
  | null;

interface HardwareSettingsPanelProps {
  onMovementSaved?: () => void;
}

export function HardwareSettingsPanel({ onMovementSaved }: HardwareSettingsPanelProps) {
  const { session } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>(null);
  const [pinTitle, setPinTitle] = useState("");
  const [pinSubtitle, setPinSubtitle] = useState<string | undefined>();
  const [pendingNewPin, setPendingNewPin] = useState("");
  const [openingDrawer, setOpeningDrawer] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);
  const [hasCustomPin, setHasCustomPin] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    try {
      setHasCustomPin(!!localStorage.getItem(DRAWER_PIN_STORAGE_KEY));
    } catch {
      setHasCustomPin(false);
    }
  }, [pinMode, message]);

  const closePin = useCallback(() => {
    setPinMode(null);
    setError(null);
    setPendingNewPin("");
  }, []);

  const startOpenDrawer = () => {
    setMessage(null);
    setError(null);
    setPinTitle("ใส่รหัสเปิดลิ้นชัก");
    setPinSubtitle("รหัส 4 หลัก — แยกจาก PIN เข้าระบบ");
    setPinMode("open-drawer");
  };

  const startCashDeposit = () => {
    setMessage(null);
    setError(null);
    setPinTitle("ใส่รหัสเปิดลิ้นชัก");
    setPinSubtitle("ยืนยันก่อนฝากเงินสด — รหัส 4 หลัก");
    setPinMode("cash-deposit");
  };

  const startCashWithdraw = () => {
    setMessage(null);
    setError(null);
    setPinTitle("ใส่รหัสเปิดลิ้นชัก");
    setPinSubtitle("ยืนยันก่อนถอนเงินสด — รหัส 4 หลัก");
    setPinMode("cash-withdraw");
  };

  const startChangePin = () => {
    setMessage(null);
    setError(null);
    setPendingNewPin("");
    setPinTitle("รหัสเปิดลิ้นชักเดิม");
    setPinSubtitle("ใส่รหัสปัจจุบันก่อนตั้งใหม่");
    setPinMode("change-current");
  };

  const handlePinComplete = async (pin: string) => {
    if (pinMode === "open-drawer") {
      if (!verifyDrawerPin(pin)) {
        setError("รหัสไม่ถูกต้อง");
        return;
      }
      closePin();
      setOpeningDrawer(true);
      try {
        const result = await openCashDrawer();
        setMessage(result.success ? result.message : null);
        if (!result.success) setError(result.message);
      } finally {
        setOpeningDrawer(false);
      }
      return;
    }

    if (pinMode === "cash-deposit") {
      if (!verifyDrawerPin(pin)) {
        setError("รหัสไม่ถูกต้อง");
        return;
      }
      closePin();
      setDepositOpen(true);
      return;
    }

    if (pinMode === "cash-withdraw") {
      if (!verifyDrawerPin(pin)) {
        setError("รหัสไม่ถูกต้อง");
        return;
      }
      closePin();
      setWithdrawOpen(true);
      return;
    }

    if (pinMode === "change-current") {
      if (!verifyDrawerPin(pin)) {
        setError("รหัสเดิมไม่ถูกต้อง");
        return;
      }
      setError(null);
      setPendingNewPin("");
      setPinTitle("ตั้งรหัสเปิดลิ้นชักใหม่");
      setPinSubtitle("รหัส 4 หลัก — ต้องไม่ซ้ำกับ PIN login");
      setPinMode("change-new");
      return;
    }

    if (pinMode === "change-new") {
      setPendingNewPin(pin);
      setError(null);
      setPinTitle("ยืนยันรหัสใหม่");
      setPinSubtitle("ใส่รหัสเดิมอีกครั้ง");
      setPinMode("change-confirm");
      return;
    }

    if (pinMode === "change-confirm") {
      if (pin !== pendingNewPin) {
        setError("รหัสไม่ตรงกัน — ลองใหม่");
        setPinTitle("ตั้งรหัสเปิดลิ้นชักใหม่");
        setPinSubtitle("รหัส 4 หลัก");
        setPinMode("change-new");
        setPendingNewPin("");
        return;
      }
      try {
        setDrawerPin(pin);
        closePin();
        setMessage("เปลี่ยนรหัสเปิดลิ้นชักแล้ว");
      } catch (e) {
        setError(e instanceof Error ? e.message : "บันทึกรหัสไม่สำเร็จ");
      }
    }
  };

  const handleTestPrint = async () => {
    setMessage(null);
    setError(null);
    setTestingPrint(true);
    try {
      const result = await printTestPage();
      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } finally {
      setTestingPrint(false);
    }
  };

  const handleDepositSaved = () => {
    setDepositOpen(false);
    onMovementSaved?.();
    setMessage("บันทึกฝากเงินสดแล้ว — เปิดลิ้นชักแล้ว · ดูได้ที่ประวัติการเงินสดด้านล่าง");
  };

  const handleWithdrawSaved = () => {
    setWithdrawOpen(false);
    onMovementSaved?.();
    setMessage("บันทึกถอนเงินสดแล้ว — เปิดลิ้นชักแล้ว · ดูได้ที่ประวัติการเงินสดด้านล่าง");
  };

  const maskedPin = "••••";

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        รหัสเปิดลิ้นชักเก็บในเครื่องนี้ — แยกจาก PIN เข้าระบบ (ค่าเริ่มต้น{" "}
        <span className="font-mono font-bold text-text-secondary">0000</span>)
      </p>
      <p className="text-sm text-text-muted">
        รหัสปัจจุบัน: <span className="font-mono font-bold tracking-widest">{maskedPin}</span>
        {!hasCustomPin && (
          <span className="ml-2 text-xs">(ยังไม่เคยเปลี่ยน — ใช้ 0000)</span>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          onClick={startOpenDrawer}
          disabled={openingDrawer}
        >
          <Wallet size={20} />
          {openingDrawer ? "กำลังเปิด..." : "เปิดลิ้นชัก"}
        </Button>
        <Button type="button" variant="income" className="gap-2" onClick={startCashDeposit}>
          <ArrowDownToLine size={20} />
          ฝากเงินสด
        </Button>
        <Button type="button" variant="danger" className="gap-2" onClick={startCashWithdraw}>
          <ArrowUpFromLine size={20} />
          ถอนเงินสด
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={startChangePin}>
          <Lock size={20} />
          เปลี่ยนรหัสเปิดลิ้นชัก
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={handleTestPrint}
          disabled={testingPrint}
        >
          <Printer size={20} />
          {testingPrint ? "กำลังพิมพ์..." : "ทดสอบพิมพ์"}
        </Button>
      </div>

      {message && <p className="text-sm font-medium text-income">{message}</p>}
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
