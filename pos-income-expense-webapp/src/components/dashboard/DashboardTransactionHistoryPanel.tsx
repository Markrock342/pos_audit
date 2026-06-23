import Link from "next/link";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AuditLog, AuditLogAction, TransactionType } from "@/types";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  FilePlus2,
  History,
  PencilLine,
} from "lucide-react";

const ACTION_META: Record<
  AuditLogAction,
  { label: string; chip: string; icon: typeof FilePlus2 }
> = {
  create: {
    label: "บันทึกใหม่",
    chip: "border-income/25 bg-income-light text-income",
    icon: FilePlus2,
  },
  update: {
    label: "แก้ไข",
    chip: "border-brand/25 bg-brand-light text-brand",
    icon: PencilLine,
  },
  void: {
    label: "ยกเลิก",
    chip: "border-expense/25 bg-expense-light text-expense",
    icon: Ban,
  },
};

const TYPE_LABELS = { income: "รายรับ", expense: "รายจ่าย" } as const;

function logAmount(log: AuditLog): { text: string; type: TransactionType } | null {
  const amount = log.newValue?.amount ?? log.oldValue?.amount;
  if (amount == null) return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;
  const type: TransactionType = log.transactionType ?? "income";
  const prefix = type === "expense" ? "-" : "+";
  return { text: `${prefix}${formatCurrency(num)}`, type };
}

interface DashboardTransactionHistoryPanelProps {
  logs: AuditLog[];
}

export function DashboardTransactionHistoryPanel({ logs }: DashboardTransactionHistoryPanelProps) {
  return (
    <Card className="flex min-h-0 flex-col 2xl:col-span-2">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between pb-2 2xl:py-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black 2xl:text-xl">
          <History size={20} className="text-brand 2xl:h-5 2xl:w-5" />
          ประวัติรายการ
        </CardTitle>
        <Link href="/history" prefetch>
          <Button variant="ghost" className="font-bold text-brand">
            ดูทั้งหมด
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pos-scroll min-h-0 flex-1 pb-4">
        {logs.length === 0 ? (
          <p className="py-6 text-center text-text-muted">
            ยังไม่มีประวัติรายรับ–รายจ่ายเดือนนี้
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const amount = logAmount(log);
              const action = ACTION_META[log.action];
              const ActionIcon = action.icon;
              const isIncome = log.transactionType === "income";

              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-2xl border border-border-default bg-surface-elevated px-3 py-3 sm:px-4"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      action.chip
                    )}
                  >
                    <ActionIcon size={18} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold sm:text-xs",
                          action.chip
                        )}
                      >
                        {action.label}
                      </span>
                      {log.transactionType && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:text-xs",
                            isIncome
                              ? "border-income/25 bg-income-light text-income"
                              : "border-expense/25 bg-expense-light text-expense"
                          )}
                        >
                          {isIncome ? (
                            <ArrowUpCircle size={11} strokeWidth={2.5} />
                          ) : (
                            <ArrowDownCircle size={11} strokeWidth={2.5} />
                          )}
                          {TYPE_LABELS[log.transactionType]}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-text-main sm:text-base">
                      {log.entityTitle ?? "ไม่มีชื่อรายการ"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      <DateTimeDisplay iso={log.createdAt} showRelative={false} className="inline!" />
                    </p>
                  </div>
                  {amount && (
                    <p
                      className={cn(
                        "shrink-0 text-sm font-black tabular-nums sm:text-base",
                        amount.type === "income" ? "text-income" : "text-expense"
                      )}
                    >
                      {amount.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
