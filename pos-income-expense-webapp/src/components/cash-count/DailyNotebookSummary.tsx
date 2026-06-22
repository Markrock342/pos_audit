"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import {
  CASH_COUNT_STATUS_LABEL,
  cashCountStatusBadgeClass,
  getCashCountStatusFromVariance,
} from "@/lib/utils/cashCountVariance";
import type { DailyLedgerSummary } from "@/types";
import { BookOpen, CheckCircle, AlertTriangle } from "lucide-react";

interface DailyNotebookSummaryProps {
  ledger: DailyLedgerSummary | null;
  actualBalance?: number | null;
  loading?: boolean;
}

export function DailyNotebookSummary({
  ledger,
  actualBalance,
  loading,
}: DailyNotebookSummaryProps) {
  if (loading) {
    return (
      <Card className="border-t-4 border-t-brand">
        <CardContent className="py-6">
          <p className="text-center text-text-muted">กำลังโหลดสรุปวัน...</p>
        </CardContent>
      </Card>
    );
  }

  if (!ledger) return null;

  const expectedClosing = ledger.cash.closing;
  const counted =
    actualBalance != null && !Number.isNaN(actualBalance) ? actualBalance : null;
  const variance = counted != null ? counted - expectedClosing : null;
  const varianceStatus =
    variance != null ? getCashCountStatusFromVariance(variance) : null;

  return (
    <Card className="border-t-4 border-t-brand bg-surface-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen size={20} className="text-brand" />
          สรุปวัน (แบบสมุด)
        </CardTitle>
        <p className="text-xs font-normal text-text-muted">
          รายรับ-รายจ่ายทั้งวัน + เงินในลิ้นชัก — เทียบกับที่นับได้
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <SummaryRow label="สรุปยอดรายรับ" value={ledger.business.totalIncome} positive />
          <SummaryRow label="รายจ่าย" value={ledger.business.totalExpense} negative />
        </div>
        <div className="border-t border-border-default pt-3">
          <SummaryRow
            label="ยอดเงินทอนคงเหลือ (คำนวณ)"
            value={expectedClosing}
            emphasize
          />
          {counted != null && (
            <SummaryRow label="นับได้จริง" value={counted} className="mt-1" />
          )}
        </div>
        {variance != null && varianceStatus && (
          <div
            className={`flex items-start gap-3 rounded-xl p-3 ${cashCountStatusBadgeClass(varianceStatus)}`}
          >
            {varianceStatus === "balanced" ? (
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold">{CASH_COUNT_STATUS_LABEL[varianceStatus]}</p>
              {varianceStatus !== "balanced" && (
                <p className="text-sm font-semibold">
                  {varianceStatus === "short" ? "ต่างขาด " : "ต่างเกิน "}
                  {formatCurrency(Math.abs(variance))}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
  positive,
  negative,
  className = "",
}: {
  label: string;
  value: number;
  emphasize?: boolean;
  positive?: boolean;
  negative?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 text-sm ${emphasize ? "font-bold text-text-main" : "text-text-secondary"} ${className}`}
    >
      <span>{label}</span>
      <span
        className={
          emphasize
            ? "text-brand"
            : positive
              ? "text-income"
              : negative
                ? "text-expense"
                : ""
        }
      >
        {negative && value > 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
