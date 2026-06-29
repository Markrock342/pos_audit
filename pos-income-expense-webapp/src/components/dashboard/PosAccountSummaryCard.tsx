import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  activeCashClosing,
  isTodayBusinessClosed,
} from "@/lib/utils/activeDayDisplay";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { DailyCloseStatus, DailyLedgerSummary } from "@/types";
import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowUpCircle,
  ArrowUpFromLine,
  Calculator,
  Wallet,
} from "lucide-react";

interface PosAccountSummaryCardProps {
  ledger: DailyLedgerSummary | null;
  status: DailyCloseStatus;
}

type RowTone = "income" | "expense" | "neutral";

function BreakdownRow({
  icon: Icon,
  label,
  amount,
  tone,
  prefix,
}: {
  icon: typeof Wallet;
  label: string;
  amount: number;
  tone: RowTone;
  prefix?: "+" | "−";
}) {
  const toneClass =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-text-main";
  const showAmount = amount > 0 || tone === "neutral";

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className={cn("flex min-w-0 items-center gap-2.5 text-sm font-bold", toneClass)}>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            tone === "income" && "bg-income-light",
            tone === "expense" && "bg-expense-light",
            tone === "neutral" && "bg-brand-light"
          )}
        >
          <Icon
            size={16}
            strokeWidth={2.25}
            className={cn(
              tone === "income" && "text-income",
              tone === "expense" && "text-expense",
              tone === "neutral" && "text-brand"
            )}
          />
        </span>
        <span className="text-text-secondary">{label}</span>
      </span>
      <span
        className={cn(
          "shrink-0 text-base font-black tabular-nums tracking-tight",
          showAmount ? toneClass : "text-text-muted"
        )}
      >
        {prefix}
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

export function PosAccountSummaryCard({ ledger, status }: PosAccountSummaryCardProps) {
  const dayClosed = isTodayBusinessClosed(status);
  const cash = ledger?.cash;
  const posDisplay = activeCashClosing(status.cashClosing, status);
  const deposited = cash?.deposited ?? 0;
  const income = cash?.income ?? 0;
  const expense = cash?.expense ?? 0;
  const withdrawn = cash?.withdrawn ?? 0;

  return (
    <Link href="/pos-cash" className="block active:scale-[0.98] transition-transform">
      <Card className="border-t-4 border-t-brand">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator size={18} className="text-brand" />
            บัญชีรวมวันนี้ (เงินสด)
          </CardTitle>
          <p className="text-xs text-text-muted">สรุปเงินในลิ้นชักรอบปัจจุบัน · แตะเพื่อฝาก/ถอน</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {dayClosed ? (
            <p className="rounded-xl bg-surface-inset px-4 py-3 text-sm font-bold text-text-muted">
              ปิดวันแล้ว — ยอดเคลียร์เป็น 0 · ดูสรุปจริงที่ ประวัติรายการ → ปิดยอด
            </p>
          ) : cash ? (
            <div className="divide-y divide-border-default rounded-2xl bg-surface-inset px-4 py-1">
              {deposited > 0 && (
                <BreakdownRow
                  icon={ArrowDownToLine}
                  label="ฝากเงินสด"
                  amount={deposited}
                  tone="income"
                  prefix="+"
                />
              )}
              <BreakdownRow
                icon={ArrowUpCircle}
                label="รายรับ (สด)"
                amount={income}
                tone="income"
                prefix="+"
              />
              <BreakdownRow
                icon={ArrowDownCircle}
                label="รายจ่าย (สด)"
                amount={expense}
                tone="expense"
                prefix="−"
              />
              {withdrawn > 0 && (
                <BreakdownRow
                  icon={ArrowUpFromLine}
                  label="ถอนออก"
                  amount={withdrawn}
                  tone="expense"
                  prefix="−"
                />
              )}
              <div className="flex items-center justify-between gap-3 border-t border-border-default py-3">
                <span className="flex min-w-0 items-center gap-2.5 text-sm font-bold text-text-secondary">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light">
                    <Wallet size={16} strokeWidth={2.25} className="text-brand" />
                  </span>
                  รวมเงินใน POS
                </span>
                <span className="shrink-0 text-lg font-black tabular-nums tracking-tight text-brand">
                  {formatCurrency(posDisplay)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">กำลังโหลด...</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
