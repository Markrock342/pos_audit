"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { CashCountDayMeta } from "@/components/cash-count/CashCountDayMeta";
import { DailyLedgerSummaryPanel } from "@/components/cash-count/DailyLedgerSummaryPanel";
import {
  fetchCashCountByDate,
  fetchCashWithdrawals,
  fetchDailyCloseByDate,
} from "@/lib/api/client";
import { formatCurrency, formatDateShort, formatWithdrawalAmount } from "@/lib/utils/format";
import type { CashCount, CashWithdrawal, DailyLedgerSummary } from "@/types";
import { ArrowLeft, ArrowDownCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function CashCountDayPage() {
  const params = useParams<{ date: string }>();
  const date = params.date ?? "";
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);
  const [cashCount, setCashCount] = useState<CashCount | null>(null);
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([]);
  const [withdrawTotal, setWithdrawTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!validDate) {
      setError("รูปแบบวันที่ไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ledgerData, countData, withdrawData] = await Promise.all([
        fetchDailyCloseByDate(date),
        fetchCashCountByDate(date),
        fetchCashWithdrawals({ withdrawalDate: date }),
      ]);
      setLedger(ledgerData);
      setCashCount(countData);
      setWithdrawals(withdrawData.data);
      setWithdrawTotal(withdrawData.totalWithdrawn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      setLedger(null);
      setCashCount(null);
      setWithdrawals([]);
      setWithdrawTotal(0);
    } finally {
      setLoading(false);
    }
  }, [date, validDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const isToday = ledger?.countDate === ledger?.businessToday;

  return (
    <AppLayout
      title={validDate ? `ปิดยอด ${formatDateShort(date)}` : "ปิดยอดรายวัน"}
      subtitle="สรุป 2 กระเป๋า · รายละเอียดวันนั้น"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">
        <Link
          href="/cash-count"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
        >
          <ArrowLeft size={16} />
          กลับหน้าสรุปปิดยอด
        </Link>

        {error && (
          <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">{error}</p>
        )}

        {loading ? (
          <p className="py-8 text-center text-text-muted">กำลังโหลด...</p>
        ) : ledger ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {isToday && (
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand">
                  วันนี้
                </span>
              )}
              {ledger.isLocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-3 py-1 text-xs text-text-muted">
                  <Lock size={12} />
                  {ledger.closedAt ? "ปิดแล้ว" : "ล็อก"}
                </span>
              )}
              {ledger.autoClosed && (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  ปิดอัตโนมัติ 00:00
                </span>
              )}
            </div>

            <DailyLedgerSummaryPanel data={ledger} loading={false} dateLabel={formatDateShort(date)} />

            <CashCountDayMeta
              cashCount={cashCount}
              expectedBalance={ledger.cash.closing}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowDownCircle size={20} className="text-expense" />
                  ถอนเงินออกจาก POS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-text-muted">ไม่มีรายการถอนในวันนี้</p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-text-muted">
                      รวม {withdrawals.length} รายการ ·{" "}
                      <span className="font-bold text-expense">{formatWithdrawalAmount(withdrawTotal)}</span>
                    </p>
                    <div className="space-y-2">
                      {withdrawals.map((row) => (
                        <div
                          key={row.id}
                          className="tablet-touch-row flex items-start justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
                        >
                          <p className="min-w-0 font-medium text-text-main">{row.note}</p>
                          <p className="shrink-0 font-black text-expense">−{formatCurrency(row.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {isToday && (
              <Link
                href="/cash-count"
                className="block rounded-2xl border-2 border-brand bg-brand/5 px-4 py-4 text-center text-sm font-bold text-brand hover:bg-brand/10"
              >
                ไปหน้าปิดยอดวันนี้
              </Link>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
