"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PAYMENT_METHODS } from "@/constants";
import { updateTransactionApi } from "@/lib/api/client";
import { TransactionCartPanel, type CartLine } from "@/components/forms/TransactionCartPanel";
import { TransactionLineBuilder } from "@/components/forms/TransactionLineBuilder";
import {
  resolveBillTitle,
  transactionToFormValues,
  type LineItemFormValues,
} from "@/lib/validations/transaction";
import type { Category, PaymentMethod, Transaction } from "@/types";

interface TransactionEditModalProps {
  transaction: Transaction;
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function newLocalId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toCartLines(items: LineItemFormValues[]): CartLine[] {
  return items.map((item) => ({ ...item, localId: newLocalId() }));
}

export function TransactionEditModal({
  transaction,
  categories,
  open,
  onClose,
  onSaved,
}: TransactionEditModalProps) {
  const filtered = categories.filter((c) => c.type === transaction.type);
  const initial = transactionToFormValues(transaction);

  const [billTitle, setBillTitle] = useState(initial.title ?? transaction.title);
  const [cartLines, setCartLines] = useState<CartLine[]>(() => toCartLines(initial.lineItems));
  const [transactionDate, setTransactionDate] = useState(transaction.transactionDate);
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod);
  const [note, setNote] = useState(transaction.note ?? "");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAddLine = (item: LineItemFormValues) => {
    setCartLines((prev) => [...prev, { ...item, localId: newLocalId() }]);
    setError(null);
  };

  const handleRemoveLine = (localId: string) => {
    setCartLines((prev) => prev.filter((l) => l.localId !== localId));
  };

  const handleSave = async () => {
    if (cartLines.length === 0) {
      setError("ต้องมีอย่างน้อย 1 รายการ");
      return;
    }
    if (!editReason.trim()) {
      setError("กรุณาระบุเหตุผลในการแก้ไข");
      return;
    }

    const lineItems = cartLines.map(({ localId: _id, ...item }, index) => ({
      ...item,
      sortOrder: index,
    }));

    setSaving(true);
    setError(null);
    try {
      await updateTransactionApi(transaction.id, {
        title: resolveBillTitle(transaction.type, billTitle, lineItems),
        transactionDate,
        paymentMethod,
        note: note.trim() || undefined,
        editReason: editReason.trim(),
        lineItems: lineItems.map((item, index) => ({
          title: item.title.trim(),
          quantity: Math.round(item.quantity),
          unitPrice: Math.round(item.unitPrice),
          categoryId: item.categoryId,
          sortOrder: index,
        })),
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
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-border-default bg-surface-elevated shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border-default px-5 py-4">
          <h3 className="text-xl font-bold">แก้ไขรายการ</h3>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-surface-hover">
            <X size={22} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
          <TransactionCartPanel
            type={transaction.type}
            lines={cartLines}
            categories={filtered}
            onRemove={handleRemoveLine}
            isSaving={saving}
            isSubmitting={false}
            hideActions
          />

          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-border-default p-3">
              <TransactionLineBuilder
                categories={filtered}
                type={transaction.type}
                onAdd={handleAddLine}
              />
            </div>

            <Input label="ชื่อบิล (ไม่บังคับ)" value={billTitle} onChange={(e) => setBillTitle(e.target.value)} />
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
            <Input label="หมายเหตุ" value={note} onChange={(e) => setNote(e.target.value)} />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-main">
                เหตุผลในการแก้ไข <span className="text-error">*</span>
              </label>
              <textarea
                className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated px-4 py-3 text-base"
                rows={2}
                placeholder="เช่น แก้จำนวนผิด"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <p className="shrink-0 px-5 pb-2 text-sm font-medium text-error">{error}</p>}

        <div className="flex shrink-0 gap-3 border-t border-border-default p-4">
          <Button className="flex-1" onClick={handleSave} disabled={saving || cartLines.length === 0}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          <Button className="flex-1" variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
        </div>
      </div>
    </div>
  );
}
