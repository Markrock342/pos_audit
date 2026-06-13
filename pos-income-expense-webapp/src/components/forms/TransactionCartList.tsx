"use client";

import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { CartLine } from "@/components/forms/TransactionCartPanel";

interface TransactionCartListProps {
  lines: CartLine[];
  onRemove: (localId: string) => void;
}

export function TransactionCartList({ lines, onRemove }: TransactionCartListProps) {
  if (lines.length === 0) return null;

  return (
    <div className="pos-cart-list mt-4 border-t border-border-default pt-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-text-muted">
        รายการ ({lines.length})
      </p>
      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li
            key={line.localId}
            className="flex min-h-14 items-center gap-2 rounded-xl border border-border-default bg-surface-inset px-3 py-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-sm font-black text-text-secondary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-main">{line.title}</p>
              <p className="text-xs text-text-muted">
                {line.quantity} × {formatCurrency(line.unitPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(line.localId)}
              className="pos-touch-btn flex min-h-14 min-w-14 items-center justify-center rounded-xl text-text-muted active:bg-expense-light active:text-expense"
              aria-label="ลบรายการ"
            >
              <Trash2 size={20} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
