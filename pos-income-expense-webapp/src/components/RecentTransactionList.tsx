import type { Category, Transaction } from "@/types";
import { getPaymentMethodLabel } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface RecentTransactionListProps {
  transactions: Transaction[];
  categories: Category[];
}

export function RecentTransactionList({
  transactions,
  categories,
}: RecentTransactionListProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border-default py-10 text-center text-base text-text-muted">
        ยังไม่มีรายการ
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => {
        const cat = categoryMap[t.categoryId];
        const isIncome = t.type === "income";
        const paymentLabel =
          getPaymentMethodLabel(t.paymentMethod);

        return (
          <div
            key={t.id}
            className="tablet-touch-row flex items-center gap-3 rounded-2xl border-2 border-border-default bg-surface-elevated px-4 transition-colors active:bg-surface-hover"
          >
            <div className={isIncome ? "text-income" : "text-expense"}>
              {isIncome ? (
                <ArrowUpCircle size={26} />
              ) : (
                <ArrowDownCircle size={26} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-text-main">
                {t.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {cat && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-2 py-0.5 text-text-secondary">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                )}
                <span className="rounded-full bg-surface-inset px-2 py-0.5 text-text-muted">
                  {paymentLabel}
                </span>
                {t.note && (
                  <span className="text-text-muted">{t.note}</span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`font-bold ${isIncome ? "text-income" : "text-expense"}`}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(t.amount)}
              </p>
              <p className="text-xs text-text-muted">
                {formatDateShort(t.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
