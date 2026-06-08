"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";
import { splitCategoryName } from "@/lib/utils/categoryDisplay";
import { computeLineAmount } from "@/lib/utils/lineAmount";
import { formatCurrency } from "@/lib/utils/format";
import type { LineItemFormValues } from "@/lib/validations/transaction";

interface TransactionLineBuilderProps {
  categories: Category[];
  type: "income" | "expense";
  onAdd: (item: LineItemFormValues) => void;
}

export function TransactionLineBuilder({ categories, type, onAdd }: TransactionLineBuilderProps) {
  const [categoryId, setCategoryId] = useState("");
  const [amountString, setAmountString] = useState("0");
  const [quantity, setQuantity] = useState(1);
  const [customTitle, setCustomTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = type === "income" ? "text-income" : "text-expense";
  const addBtn =
    type === "income"
      ? "bg-income text-white active:bg-income/90"
      : "bg-expense text-white active:bg-expense/90";

  const unitPrice = Math.round(parseInt(amountString, 10) || 0);
  const linePreview = computeLineAmount(quantity, unitPrice);
  const selectedCat = categories.find((c) => c.id === categoryId);

  const resetDraft = () => {
    setAmountString("0");
    setQuantity(1);
    setCustomTitle("");
    setShowTitle(false);
    setError(null);
  };

  const handleAdd = () => {
    if (!categoryId) {
      setError("กรุณาเลือกหมวดหมู่");
      return;
    }
    if (unitPrice <= 0) {
      setError("กรุณาใส่จำนวนเงิน");
      return;
    }
    const catLabel = selectedCat ? splitCategoryName(selectedCat.name).label : "รายการ";
    onAdd({
      categoryId,
      quantity,
      unitPrice,
      title: customTitle.trim() || catLabel,
    });
    resetDraft();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-lg font-bold text-text-secondary">
          1. เลือกหมวดหมู่ <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((category) => {
            const { label } = splitCategoryName(category.name);
            const selected = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setCategoryId(category.id);
                  setError(null);
                }}
                className={`min-h-[76px] rounded-2xl border-2 p-3 text-center text-base font-bold shadow-sm transition-all active:scale-[0.98] ${
                  selected ? "scale-[1.02] shadow-lg" : ""
                } ${!selected ? "border-border-default bg-surface-elevated" : ""}`}
                style={
                  selected
                    ? {
                        borderColor: category.color,
                        backgroundColor: `${category.color}18`,
                      }
                    : undefined
                }
              >
                <div
                  className="mx-auto mb-1.5 h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-lg font-bold text-text-secondary">2. จำนวน</label>
        <div className="flex max-w-xs items-stretch gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex min-h-[72px] min-w-[72px] items-center justify-center rounded-2xl border-2 border-border-default bg-surface-hover text-text-main shadow-md active:scale-95 disabled:opacity-40"
            aria-label="ลดจำนวน"
          >
            <Minus size={28} strokeWidth={2.5} />
          </button>
          <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-border-default bg-surface-elevated shadow-inner">
            <span className="text-4xl font-black tabular-nums text-text-main">{quantity}</span>
          </div>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex min-h-[72px] min-w-[72px] items-center justify-center rounded-2xl border-2 border-border-default bg-surface-hover text-text-main shadow-md active:scale-95"
            aria-label="เพิ่มจำนวน"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-lg font-bold text-text-secondary">
          3. ราคาต่อหน่วย (บาท) <span className="text-error">*</span>
        </label>
        <AmountDisplay value={amountString} label="แตะปุ่มด้านล่างเพื่อใส่ตัวเลข" active />
        <div className="mt-3">
          <AmountNumpad
            integerOnly
            value={amountString}
            onChange={(v) => {
              setAmountString(v);
              setError(null);
            }}
          />
        </div>
        {quantity > 1 && unitPrice > 0 && (
          <p className={`mt-2 text-sm font-bold ${accent}`}>
            {quantity} × {formatCurrency(unitPrice)} = {formatCurrency(linePreview)}
          </p>
        )}
      </div>

      <div>
        {!showTitle ? (
          <button
            type="button"
            onClick={() => setShowTitle(true)}
            className="text-sm font-semibold text-text-muted underline-offset-2 hover:underline"
          >
            + ตั้งชื่อรายการเอง (ไม่บังคับ)
          </button>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-muted">ชื่อรายการ</label>
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={selectedCat ? splitCategoryName(selectedCat.name).label : "เช่น ปูนตรา A"}
              className="w-full rounded-xl border-2 border-border-default bg-surface-elevated px-4 py-3 text-lg min-h-[52px]"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm font-bold text-error">{error}</p>}

      <button
        type="button"
        onClick={handleAdd}
        className={`flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl text-xl font-black shadow-lg active:scale-[0.99] ${addBtn}`}
      >
        <Plus size={24} />
        เพิ่มรายการ
      </button>
    </div>
  );
}
