"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PAYMENT_METHODS } from "@/constants";
import { updateTransactionApi } from "@/lib/api/client";
import type { Category, PaymentMethod, Transaction } from "@/types";

interface TransactionEditModalProps {
  transaction: Transaction;
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionEditModal({
  transaction,
  categories,
  open,
  onClose,
  onSaved,
}: TransactionEditModalProps) {
  const filtered = categories.filter((c) => c.type === transaction.type);
  const [title, setTitle] = useState(transaction.title);
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [transactionDate, setTransactionDate] = useState(transaction.transactionDate);
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod);
  const [note, setNote] = useState(transaction.note ?? "");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || !categoryId || !parsedAmount || parsedAmount <= 0) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (!editReason.trim()) {
      setError("กรุณาระบุเหตุผลในการแก้ไข");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateTransactionApi(transaction.id, {
        title: title.trim(),
        categoryId,
        amount: parsedAmount,
        transactionDate,
        paymentMethod,
        note: note.trim() || undefined,
        editReason: editReason.trim(),
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "แก้ไขไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-border-default bg-surface-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">แก้ไขรายการ</h3>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-surface-hover">
            <X size={22} />
          </button>
        </div>
        <div className="space-y-4">
          <Input label="รายการ" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select
            label="หมวดหมู่"
            options={filtered.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <Input
            label="จำนวนเงิน"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="วันที่"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
          <Select
            label="ช่องทางชำระ"
            options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          />
          <Input
            label="หมายเหตุ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-main">
              เหตุผลในการแก้ไข <span className="text-error">*</span>
            </label>
            <textarea
              className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated px-4 py-3 text-base"
              rows={2}
              placeholder="เช่น แก้จำนวนเงินผิด, เปลี่ยนหมวดหมู่"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
            />
          </div>
          {error && <p className="text-sm font-medium text-error">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
