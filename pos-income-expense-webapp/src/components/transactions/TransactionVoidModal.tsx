"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { voidTransactionApi } from "@/lib/api/client";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils/format";

interface TransactionVoidModalProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
  onVoided: () => void;
}

export function TransactionVoidModal({
  transaction,
  open,
  onClose,
  onVoided,
}: TransactionVoidModalProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleVoid = async () => {
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผล");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await voidTransactionApi(transaction.id, reason.trim());
      onVoided();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ยกเลิกรายการไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-border-default bg-surface-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">ยกเลิกรายการ</h3>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-surface-hover">
            <X size={22} />
          </button>
        </div>
        <p className="text-text-secondary">
          ยกเลิก &quot;{transaction.title}&quot; ({formatCurrency(transaction.amount)}) — รายการจะยังอยู่แต่ไม่นับในยอดรวม
        </p>
        <textarea
          className="mt-4 w-full rounded-2xl border-2 border-border-default bg-surface-elevated px-4 py-3 text-base"
          rows={3}
          placeholder="เหตุผล เช่น คีย์ซ้ำ, ลูกค้ายกเลิก"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <p className="mt-2 text-sm font-medium text-error">{error}</p>}
        <div className="mt-4 flex gap-3">
          <Button variant="danger" className="flex-1" onClick={handleVoid} disabled={saving}>
            {saving ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </div>
  );
}
