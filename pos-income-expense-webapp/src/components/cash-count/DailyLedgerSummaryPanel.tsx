"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import type { DailyLedgerSummary } from "@/types";
import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowUpCircle,
  ArrowUpFromLine,
  Banknote,
} from "lucide-react";

function CashMovementRow({
  kind,
  label,
  amount,
}: {
  kind: "deposit" | "withdraw";
  label: string;
  amount: number;
}) {
  const isDeposit = kind === "deposit";
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;
  const tone = isDeposit ? "text-income" : "text-expense";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("flex min-w-0 items-center gap-2 text-sm font-bold", tone)}>
        <Icon size={18} strokeWidth={2.25} className="shrink-0" />
        {label}
      </span>
      <span className={cn("shrink-0 text-xl font-black tracking-tight", amount > 0 ? tone : "text-text-muted")}>
        {isDeposit ? "+" : "−"}
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

interface DailyLedgerSummaryPanelProps {
  data: DailyLedgerSummary | null;
  loading?: boolean;
  /** แทนคำว่า "วันนี้" ในหัวข้อการ์ด */
  dateLabel?: string;
}

export function DailyLedgerSummaryPanel({ data, loading, dateLabel }: DailyLedgerSummaryPanelProps) {
  const dayLabel = dateLabel ?? "วันนี้";

  if (loading) {
    return (
      <Card className="border-t-4 border-t-brand">
        <CardContent className="py-8">
          <p className="text-center text-text-muted">กำลังโหลดสรุป...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const deposited = data.cash.deposited ?? 0;
  const withdrawn = data.cash.withdrawn ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-l-4 border-l-income">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpCircle size={20} className="text-income" />
            รายรับ
          </CardTitle>
          <p className="text-xs text-text-muted">ยอดเงินเข้า {dayLabel}</p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-black text-income">
            {formatCurrency(data.business.totalIncome)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-expense">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownCircle size={20} className="text-expense" />
            รายจ่าย
          </CardTitle>
          <p className="text-xs text-text-muted">ยอดเงินออก {dayLabel}</p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-black text-expense">
            {formatCurrency(data.business.totalExpense)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-brand">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote size={20} className="text-brand" />
            เงินสดใน POS
          </CardTitle>
          <p className="text-xs text-text-muted">ฝาก / ถอน — ไม่นับเป็นรายรับ–รายจ่าย</p>
        </CardHeader>
        <CardContent className="flex flex-col justify-center gap-4">
          <CashMovementRow kind="deposit" label="ฝากเงินสด" amount={deposited} />
          <CashMovementRow kind="withdraw" label="ถอนเงินสด" amount={withdrawn} />
        </CardContent>
      </Card>
    </div>
  );
}
