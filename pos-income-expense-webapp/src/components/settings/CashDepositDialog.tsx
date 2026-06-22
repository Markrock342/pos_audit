"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";
import { createCashDepositApi } from "@/lib/api/client";
import { openCashDrawer } from "@/lib/hardware/cashDrawer";
import { formatCurrency } from "@/lib/utils/format";
import type { CashDeposit } from "@/types";

interface CashDepositDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (created: CashDeposit) => void;
  recordedBy?: string;
}

export function CashDepositDialog({
  open,
  onClose,
  onSaved,
  recordedBy,
}: CashDepositDialogProps) {
  const [amount, setAmount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    if (saving) return;
    setAmount("0");
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError("กรุณากรอกจำนวนเงินที่ฝาก");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createCashDepositApi({
        amount: value,
        recordedBy,
      });
      setAmount("0");
      onSaved?.(created);
      onClose();
      void openCashDrawer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกฝากไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} aria-hidden />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-2 border-border-default bg-surface-elevated shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div>
            <h3 className="text-xl font-bold text-text-main">ฝากเงินสด</h3>
            <p className="mt-0.5 text-sm text-text-muted">
              เพิ่มเงินสดใน POS — ไม่นับเป็นรายรับธุรกิจ
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-text-muted hover:bg-surface-hover"
            aria-label="ปิด"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <AmountDisplay label="จำนวนเงินที่ฝาก" value={amount} active />
          <AmountNumpad value={amount} onChange={setAmount} />

          <p className="rounded-xl bg-surface-inset px-4 py-3 text-sm text-text-secondary">
            ยอดเงินสดใน POS จะเพิ่ม {formatCurrency(parseFloat(amount) || 0)} · ดูประวัติได้ที่การ์ดด้านล่าง
          </p>

          {error && <p className="text-sm font-medium text-error">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-border-default px-5 py-4">
          <Button className="flex-1" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          <Button variant="outline" size="lg" onClick={handleClose} disabled={saving}>
            ยกเลิก
          </Button>
        </div>
      </div>
    </div>
  );
}
