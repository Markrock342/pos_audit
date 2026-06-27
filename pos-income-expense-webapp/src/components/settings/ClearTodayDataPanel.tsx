"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PinPadDialog, type PinCompleteResult } from "@/components/settings/PinPadDialog";
import { clearTodayDataApi } from "@/lib/api/client";
import { verifyDrawerPin } from "@/lib/hardware/drawerPinStorage";
import { formatDateShort } from "@/lib/utils/format";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { AlertTriangle, Trash2 } from "lucide-react";

export function ClearTodayDataPanel() {
  const businessToday = getBusinessToday();
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const submittingRef = useRef(false);

  const handlePinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (submittingRef.current) return false;
    if (!verifyDrawerPin(pin)) {
      setPinError("รหัสไม่ถูกต้อง");
      return false;
    }

    submittingRef.current = true;
    setPinOpen(false);
    setPinError(null);
    setClearing(true);
    setMessage(null);
    setError(null);

    try {
      const result = await clearTodayDataApi();
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ล้างข้อมูลไม่สำเร็จ");
    } finally {
      submittingRef.current = false;
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-expense/25 bg-expense-light/40 px-4 py-3 text-sm text-text-secondary">
        <p className="flex items-start gap-2 font-bold text-expense">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          ล้างเฉพาะวันนี้ — ไม่สามารถกู้คืนได้
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>รายรับ / รายจ่าย และประวัติรายการ</li>
          <li>ฝาก / ถอน เงินสดใน POS</li>
          <li>ปิดยอด ทุกรอบ แก้ไขปิดยอด และสรุปปิดยอด</li>
          <li>ยอดบนหน้าภาพรวมของวันนี้</li>
        </ul>
        <p className="mt-2 text-xs font-bold text-text-main">
          วันที่จะล้าง: {formatDateShort(businessToday)}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          ข้อมูลวันอื่น · หมวดหมู่ · ตั้งค่าร้าน — ไม่ถูกลบ
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-expense/40 text-expense hover:bg-expense-light sm:w-auto"
        disabled={clearing}
        onClick={() => {
          setPinError(null);
          setPinOpen(true);
        }}
      >
        <Trash2 size={18} />
        {clearing ? "กำลังล้างข้อมูล..." : "ล้างข้อมูลวันนี้"}
      </Button>

      {message && (
        <p className="text-sm font-bold text-income" role="status">
          {message}
        </p>
      )}
      {error && !pinOpen && (
        <p className="text-sm font-bold text-expense" role="alert">
          {error}
        </p>
      )}

      <PinPadDialog
        key={pinOpen ? "clear-today" : "clear-today-closed"}
        open={pinOpen}
        title="ใส่รหัสเปิดลิ้นชัก"
        subtitle="ยืนยันก่อนล้างข้อมูลวันนี้ — รหัส 4 หลัก (เดียวกับเปิดลิ้นชัก)"
        error={pinError}
        onComplete={handlePinComplete}
        onCancel={() => {
          setPinOpen(false);
          setPinError(null);
        }}
      />
    </div>
  );
}
