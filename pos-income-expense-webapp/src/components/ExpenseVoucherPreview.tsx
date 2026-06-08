"use client";

import { useMemo, useRef } from "react";
import type { Category, Transaction } from "@/types";
import { DefaultExpenseVoucherTemplate } from "@/receipt-templates/default-expense-voucher";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { resolveExpenseVoucherNumber } from "@/lib/utils/receiptFormat";
import { cn } from "@/lib/utils/cn";

interface ExpenseVoucherPreviewProps {
  transaction: Transaction;
  categories: Category[];
  fill?: boolean;
  compact?: boolean;
}

function readRecorderName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return undefined;
    return (JSON.parse(raw) as KioskSession).displayName;
  } catch {
    return undefined;
  }
}

export function ExpenseVoucherPreview({
  transaction,
  categories,
  fill,
  compact,
}: ExpenseVoucherPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { organization } = useOrganization();
  const shopName = organization?.receiptConfig?.header ?? organization?.name;
  const recorderName = readRecorderName();
  const voucherNumber = resolveExpenseVoucherNumber(transaction);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const lineCount = transaction.lineItems?.length ?? 1;

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>ใบบันทึกรายจ่าย</title>
      <style>
        body{margin:0;padding:8px;font-family:"Courier New",Consolas,monospace;font-size:11px;}
        *{box-sizing:border-box;}
      </style>
      </head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Card className={cn("flex flex-col", fill && "h-full min-h-[280px] xl:min-h-0")}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border-default/60 py-3">
        <div className="min-w-0">
          <CardTitle className={cn(compact && "text-base")}>ใบบันทึกรายจ่าย</CardTitle>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {transaction.title} · {lineCount} รายการ · {formatCurrency(transaction.amount)}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 shrink-0 px-2.5">
          <Printer size={15} />
          พิมพ์
        </Button>
      </CardHeader>
      <CardContent
        className={cn(
          "flex flex-1 flex-col",
          compact ? "min-h-0 overflow-hidden p-2" : "p-4",
          fill && !compact && "min-h-0 overflow-hidden"
        )}
      >
        <div
          className={cn(
            "flex flex-1 rounded-xl border border-border-default bg-[#f4f4f5]",
            compact ? "min-h-0 overflow-y-auto p-2" : "items-start justify-center p-4",
            fill && !compact && "min-h-0 overflow-y-auto"
          )}
        >
          <div
            ref={printRef}
            className={cn("rounded-lg bg-white shadow-lg", compact || fill ? "w-full" : "")}
          >
            <DefaultExpenseVoucherTemplate
              transaction={transaction}
              voucherNumber={voucherNumber}
              shopName={shopName}
              recorderName={recorderName}
              categoryNames={categoryNames}
              fullWidth={compact || fill}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
