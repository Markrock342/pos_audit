"use client";

import { Trash2 } from "lucide-react";
import type { Category } from "@/types";
import { computeLineAmount } from "@/lib/utils/lineAmount";
import { formatCurrency } from "@/lib/utils/format";
import { splitCategoryName } from "@/lib/utils/categoryDisplay";
import type { LineItemFormValues } from "@/lib/validations/transaction";
import { Button } from "@/components/ui/Button";

export interface CartLine extends LineItemFormValues {
  localId: string;
}

interface TransactionCartPanelProps {
  type: "income" | "expense";
  lines: CartLine[];
  categories: Category[];
  onRemove: (localId: string) => void;
  isSaving: boolean;
  isSubmitting: boolean;
  onCancel?: () => void;
  hideActions?: boolean;
}

export function TransactionCartPanel({
  type,
  lines,
  categories,
  onRemove,
  isSaving,
  isSubmitting,
  onCancel,
  hideActions,
}: TransactionCartPanelProps) {
  const accent = type === "income" ? "text-income" : "text-expense";
  const borderAccent = type === "income" ? "border-t-income" : "border-t-expense";
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const busy = isSaving || isSubmitting;

  const grandTotal = lines.reduce(
    (sum, line) => sum + computeLineAmount(line.quantity, line.unitPrice),
    0
  );

  return (
    <div
      className={`flex flex-col rounded-2xl border-2 border-border-default bg-surface-inset lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] ${borderAccent} border-t-4`}
    >
      <div className="shrink-0 border-b border-border-default/60 px-4 py-4">
        <p className="text-sm font-semibold text-text-muted">รายการในบิล</p>
        <p className={`mt-1 text-4xl font-black tabular-nums ${accent}`}>
          {formatCurrency(grandTotal)}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">{lines.length} รายการ</p>
      </div>

      <div className="min-h-[100px] flex-1 overflow-y-auto px-3 py-3">
        {lines.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">
            ยังไม่มีรายการ — เลือกหมวด + ใส่ราคา แล้วกดเพิ่มรายการ
          </p>
        ) : (
          <ul className="space-y-2">
            {lines.map((line, index) => {
              const cat = categoryMap[line.categoryId];
              const catLabel = cat ? splitCategoryName(cat.name).label : "";
              const total = computeLineAmount(line.quantity, line.unitPrice);
              return (
                <li
                  key={line.localId}
                  className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-elevated px-3 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-inset text-sm font-black text-text-secondary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-main">{line.title}</p>
                    <p className="text-xs text-text-muted">
                      {line.quantity} × {formatCurrency(line.unitPrice)}
                      {catLabel && (
                        <>
                          {" · "}
                          <span style={{ color: cat?.color }}>{catLabel}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-black tabular-nums ${accent}`}>
                    {formatCurrency(total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(line.localId)}
                    className="shrink-0 rounded-xl p-2 text-text-muted active:bg-expense-light active:text-expense"
                    aria-label="ลบรายการ"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!hideActions && (
        <div className="shrink-0 space-y-2 border-t border-border-default/60 p-4">
          <Button
            type="submit"
            disabled={busy || lines.length === 0}
            size="lg"
            variant={type === "income" ? "income" : "danger"}
            className="hidden w-full text-xl font-black shadow-lg lg:flex"
          >
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              size="lg"
              className="hidden w-full text-lg font-bold lg:flex"
            >
              ยกเลิก
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
