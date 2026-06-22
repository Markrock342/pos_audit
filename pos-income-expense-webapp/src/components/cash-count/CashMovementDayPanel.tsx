"use client";

import { formatCurrency, formatWithdrawalAmount } from "@/lib/utils/format";
import type { CashDeposit, CashWithdrawal } from "@/types";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface CashMovementDayPanelProps {
  deposits: CashDeposit[];
  depositTotal: number;
  withdrawals: CashWithdrawal[];
  withdrawTotal: number;
}

export function CashMovementDayPanel({
  deposits,
  depositTotal,
  withdrawals,
  withdrawTotal,
}: CashMovementDayPanelProps) {
  const empty = deposits.length === 0 && withdrawals.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ฝาก / ถอนเงินสด (วันนี้)</CardTitle>
        <p className="text-xs font-normal text-text-muted">
          ไม่นับเป็นรายรับ–รายจ่ายธุรกิจ · สรุปเงินเข้า–ออกจากลิ้นชัก
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {empty ? (
          <p className="text-sm text-text-muted">ไม่มีรายการฝากหรือถอนในวันนี้</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-inset px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs text-text-muted">
                  <ArrowDownToLine size={14} className="text-income" />
                  ฝากรวม
                </p>
                <p className="text-lg font-black text-income">{formatCurrency(depositTotal)}</p>
                <p className="text-xs text-text-muted">{deposits.length} รายการ</p>
              </div>
              <div className="rounded-xl bg-surface-inset px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs text-text-muted">
                  <ArrowUpFromLine size={14} className="text-expense" />
                  ถอนรวม
                </p>
                <p className="text-lg font-black text-expense">{formatWithdrawalAmount(withdrawTotal)}</p>
                <p className="text-xs text-text-muted">{withdrawals.length} รายการ</p>
              </div>
            </div>

            {deposits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted">รายการฝาก</p>
                {deposits.map((row) => (
                  <div
                    key={row.id}
                    className="tablet-touch-row flex items-center justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
                  >
                    <span className="font-medium text-text-main">ฝากเงินสด</span>
                    <span className="font-black text-income">+{formatCurrency(row.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {withdrawals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted">รายการถอน</p>
                {withdrawals.map((row) => (
                  <div
                    key={row.id}
                    className="tablet-touch-row flex items-center justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
                  >
                    <span className="min-w-0 font-medium text-text-main">{row.note}</span>
                    <span className="shrink-0 font-black text-expense">
                      {formatWithdrawalAmount(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
