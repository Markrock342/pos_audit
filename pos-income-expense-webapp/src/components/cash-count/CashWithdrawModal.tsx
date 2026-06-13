"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";
import { createCashWithdrawalApi } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/format";

interface CashWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  recordedBy?: string;
  readOnly?: boolean;
}

export function CashWithdrawModal({
  open,
  onClose,
  onSaved,
  recordedBy,
  readOnly,
}: CashWithdrawModalProps) {
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    if (saving) return;
    setAmount("0");
    setNote("");
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    if (readOnly) return;
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError("กรุณากรอกจำนวนเงินที่ถอน");
      return;
    }
    if (!note.trim()) {
      setError("กรุณาระบุหมายเหตุ เช่น นำไปฝากธนาคาร");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createCashWithdrawalApi({
        amount: value,
        note: note.trim(),
        recordedBy,
      });
      setAmount("0");
      setNote("");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกถอนไม่สำเร็จ");
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
            <h3 className="text-xl font-bold text-text-main">ถอนเงินออกจาก POS</h3>
            <p className="mt-0.5 text-sm text-text-muted">
              ไม่เปิดลิ้นชัก — บันทึกยอดที่นำออกแล้วเท่านั้น
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
          <AmountDisplay label="จำนวนเงินที่ถอน" value={amount} active />
          <AmountNumpad value={amount} onChange={setAmount} />

          <Input
            label="หมายเหตุ (บังคับ)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น นำไปฝากธนาคาร, เก็บกลับบ้าน"
            disabled={readOnly}
          />

          <p className="rounded-xl bg-surface-inset px-4 py-3 text-sm text-text-secondary">
            ยอดเงินสดใน POS จะลด {formatCurrency(parseFloat(amount) || 0)} — ยอดโอนในสมุดไม่เปลี่ยน
          </p>

          {error && <p className="text-sm font-medium text-error">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-border-default px-5 py-4">
          <Button
            className="flex-1"
            size="lg"
            onClick={handleSave}
            disabled={saving || readOnly}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการถอน"}
          </Button>
          <Button variant="outline" size="lg" onClick={handleClose} disabled={saving}>
            ยกเลิก
          </Button>
        </div>
      </div>
    </div>
  );
}
