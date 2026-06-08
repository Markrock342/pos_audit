"use client";

import type { Category, Transaction } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FileText } from "lucide-react";

interface TransactionDetailPreviewProps {
  transaction: Transaction;
  categories: Category[];
  fill?: boolean;
}

export function TransactionDetailPreview({
  transaction,
  categories,
  fill,
}: TransactionDetailPreviewProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const lines = transaction.lineItems ?? [];
  const paymentLabel =
    PAYMENT_METHODS.find((p) => p.value === transaction.paymentMethod)?.label ??
    transaction.paymentMethod;

  return (
    <Card className={cn("flex flex-col", fill && "h-full min-h-[280px] xl:min-h-0")}>
      <CardHeader className="shrink-0 border-b border-border-default/60 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-black">
          <FileText size={18} className="text-expense" />
          รายละเอียด
        </CardTitle>
        <p className="mt-1 truncate text-sm text-text-muted">{transaction.title}</p>
      </CardHeader>
      <CardContent className={cn("flex min-h-0 flex-1 flex-col gap-3 p-4", fill && "overflow-y-auto")}>
        <div className="space-y-1 text-sm">
          <p className="text-text-muted">
            วันที่บันทึก: <DateTimeDisplay iso={transaction.createdAt} />
          </p>
          <p className="text-text-muted">ช่องทาง: {paymentLabel}</p>
          <p className="text-2xl font-black text-expense">-{formatCurrency(transaction.amount)}</p>
        </div>

        {lines.length > 0 ? (
          <ul className="divide-y divide-border-subtle rounded-xl border border-border-default text-sm">
            {lines.map((line, idx) => {
              const cat = categoryMap[line.categoryId];
              return (
                <li key={line.id ?? idx} className="flex items-start justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium">{line.title}</p>
                    {cat && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                        {cat.color && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        {cat.name}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">
                      {line.quantity} × {formatCurrency(line.unitPrice)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-expense">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">1 รายการ · {formatCurrency(transaction.amount)}</p>
        )}

        {transaction.note && (
          <p className="rounded-lg bg-surface-inset px-3 py-2 text-sm text-text-secondary">
            {transaction.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
