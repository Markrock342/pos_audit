"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Category } from "@/types";
import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";
import { splitCategoryName } from "@/lib/utils/categoryDisplay";
import { computeLineAmount } from "@/lib/utils/lineAmount";
import { formatCurrency } from "@/lib/utils/format";
import type { LineItemFormValues } from "@/lib/validations/transaction";

interface CategoryPanelProps {
  categories: Category[];
  categoryId: string;
  onSelect: (id: string) => void;
}

export function TransactionCategoryPanel({ categories, categoryId, onSelect }: CategoryPanelProps) {
  return (
    <div className="pos-category-panel">
      <h3 className="pos-panel-title mb-2 text-sm font-black uppercase tracking-wide text-text-secondary">
        1. หมวด <span className="text-error">*</span>
      </h3>
      <div className="pos-category-list grid grid-cols-2 gap-2 lg:grid-cols-1 xl:grid-cols-2">
        {categories.map((category) => {
          const { label } = splitCategoryName(category.name);
          const selected = categoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`pos-category-chip flex min-h-14 items-center gap-2 rounded-xl border-2 px-3 text-left text-sm font-bold transition-all active:scale-[0.98] ${
                selected ? "shadow-md" : "border-border-default bg-surface-elevated"
              }`}
              style={
                selected
                  ? {
                      borderColor: category.color,
                      backgroundColor: `${category.color}20`,
                    }
                  : undefined
              }
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="min-w-0 truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface AmountPanelProps {
  type: "income" | "expense";
  amountString: string;
  quantity: number;
  error: string | null;
  onAmountChange: (v: string) => void;
  onQuantityChange: (fn: (q: number) => number) => void;
  onAdd: () => void;
}

export function TransactionLineTitleField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pos-line-title mt-4 border-t border-border-default pt-4">
      <label className="mb-1 block text-xs font-semibold text-text-secondary">
        ชื่อรายการ <span className="font-normal text-text-muted">(ว่างได้ — ใช้ชื่อหมวด)</span>
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="เช่น น้ำดื่ม, ค่าขนส่ง"
        className="pos-bill-input min-h-14 w-full rounded-xl border-2 border-border-default bg-surface-inset px-3 text-base"
      />
    </div>
  );
}

export function TransactionAmountPanel({
  type,
  amountString,
  quantity,
  error,
  onAmountChange,
  onQuantityChange,
  onAdd,
}: AmountPanelProps) {
  const accent = type === "income" ? "text-income" : "text-expense";
  const addBtn =
    type === "income"
      ? "bg-income text-white active:bg-income/90"
      : "bg-expense text-white active:bg-expense/90";

  const unitPrice = Math.round(parseInt(amountString, 10) || 0);
  const linePreview = computeLineAmount(quantity, unitPrice);

  return (
    <div className="pos-amount-panel flex min-h-0 flex-1 flex-col">
      <div className="pos-line-qty mb-2 flex shrink-0 items-center gap-2">
        <span className="text-xs font-bold text-text-muted">จำนวน</span>
        <div className="pos-qty-row flex flex-1 items-stretch gap-2">
          <button
            type="button"
            onClick={() => onQuantityChange((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="pos-touch-btn flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-border-default bg-surface-hover active:scale-95 disabled:opacity-40"
            aria-label="ลดจำนวน"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
          <div className="flex min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-border-default bg-surface-elevated">
            <span className="text-2xl font-black tabular-nums">{quantity}</span>
          </div>
          <button
            type="button"
            onClick={() => onQuantityChange((q) => q + 1)}
            className="pos-touch-btn flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-border-default bg-surface-hover active:scale-95"
            aria-label="เพิ่มจำนวน"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="pos-numpad-stack flex min-h-0 flex-1 flex-col">
        <AmountDisplay value={amountString} label="ราคา (บาท)" active compact />
        <div className="mt-1.5 min-h-0 flex-1">
          <AmountNumpad integerOnly touch value={amountString} onChange={onAmountChange} />
        </div>
        {quantity > 1 && unitPrice > 0 && (
          <p className={`mt-1 shrink-0 text-center text-xs font-bold ${accent}`}>
            {quantity} × {formatCurrency(unitPrice)} = {formatCurrency(linePreview)}
          </p>
        )}
      </div>

      <div className="pos-line-add-row mt-auto shrink-0 space-y-1.5 pt-2">
        {error && <p className="text-xs font-bold text-error">{error}</p>}
        <button
          type="button"
          onClick={onAdd}
          className={`pos-touch-btn flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-black shadow-md active:scale-[0.99] ${addBtn}`}
        >
          <Plus size={18} />
          เพิ่มรายการ
        </button>
      </div>
    </div>
  );
}

interface TransactionLineBuilderProps {
  categories: Category[];
  type: "income" | "expense";
  onAdd: (item: LineItemFormValues) => void;
  onDraftChange?: (draft: LineItemFormValues | null) => void;
  /** @deprecated use TransactionCategoryPanel + TransactionAmountPanel */
  layout?: "legacy";
}

/** Hook state shared between category + amount panels */
export function useTransactionLineDraft(
  categories: Category[],
  onDraftChange?: (draft: LineItemFormValues | null) => void
) {
  const [categoryId, setCategoryId] = useState("");
  const [amountString, setAmountString] = useState("0");
  const [quantity, setQuantity] = useState(1);
  const [customTitle, setCustomTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unitPrice = Math.round(parseInt(amountString, 10) || 0);
  const selectedCat = categories.find((c) => c.id === categoryId);

  const resetDraft = () => {
    setCategoryId("");
    setAmountString("0");
    setQuantity(1);
    setCustomTitle("");
    setError(null);
    onDraftChange?.(null);
  };

  useEffect(() => {
    if (!onDraftChange) return;
    const hasActivity =
      categoryId || unitPrice > 0 || quantity !== 1 || customTitle.trim().length > 0;
    if (!hasActivity) {
      onDraftChange(null);
      return;
    }
    const catLabel = selectedCat ? splitCategoryName(selectedCat.name).label : "";
    onDraftChange({
      categoryId,
      quantity,
      unitPrice,
      title: customTitle.trim() || catLabel || "รายการใหม่",
    });
  }, [categoryId, unitPrice, quantity, customTitle, selectedCat, onDraftChange]);

  const handleAdd = (onAdd: (item: LineItemFormValues) => void) => {
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

  return {
    categoryId,
    setCategoryId,
    amountString,
    setAmountString,
    quantity,
    setQuantity,
    customTitle,
    setCustomTitle,
    error,
    setError,
    handleAdd,
    resetDraft,
  };
}

export function TransactionLineBuilder({
  categories,
  type,
  onAdd,
  onDraftChange,
}: TransactionLineBuilderProps) {
  const draft = useTransactionLineDraft(categories, onDraftChange);

  return (
    <>
      <TransactionCategoryPanel
        categories={categories}
        categoryId={draft.categoryId}
        onSelect={(id) => {
          draft.setCategoryId(id);
          draft.setError(null);
        }}
      />
      <TransactionLineTitleField value={draft.customTitle} onChange={draft.setCustomTitle} />
      <TransactionAmountPanel
        type={type}
        amountString={draft.amountString}
        quantity={draft.quantity}
        error={draft.error}
        onAmountChange={(v) => {
          draft.setAmountString(v);
          draft.setError(null);
        }}
        onQuantityChange={(fn) => draft.setQuantity(fn)}
        onAdd={() => draft.handleAdd(onAdd)}
      />
    </>
  );
}
