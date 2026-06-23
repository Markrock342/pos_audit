"use client";

import { useCallback, useEffect, useState } from "react";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import { fetchCashDeposits, fetchCashWithdrawals } from "@/lib/api/client";
import { getBusinessToday, shiftBusinessDate } from "@/lib/utils/businessDate";
import {
  formatCurrency,
  formatDateShort,
  formatDateTime,
  formatWithdrawalAmount,
} from "@/lib/utils/format";
import type { CashDeposit, CashWithdrawal } from "@/types";
import { CashMovementListScroll } from "@/components/cash-movement/CashMovementListScroll";

type HistoryTab = "deposit" | "withdraw";

const TABS = [
  { id: "deposit" as const, label: "ฝาก" },
  { id: "withdraw" as const, label: "ถอน" },
];

interface CashMovementHistoryPanelProps {
  refreshKey?: number;
}

export function CashMovementHistoryPanel({ refreshKey = 0 }: CashMovementHistoryPanelProps) {
  const endDate = getBusinessToday();
  const startDate = shiftBusinessDate(endDate, -30);
  const [activeTab, setActiveTab] = useState<HistoryTab>("deposit");
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([]);
  const [depositTotal, setDepositTotal] = useState(0);
  const [withdrawTotal, setWithdrawTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [depositResult, withdrawResult] = await Promise.all([
        fetchCashDeposits({ startDate, endDate }),
        fetchCashWithdrawals({ startDate, endDate }),
      ]);
      setDeposits(depositResult.data);
      setDepositTotal(depositResult.totalDeposited);
      setWithdrawals(withdrawResult.data);
      setWithdrawTotal(withdrawResult.totalWithdrawn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ");
      setDeposits([]);
      setWithdrawals([]);
      setDepositTotal(0);
      setWithdrawTotal(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div id="cash-movement-history" className="space-y-4 scroll-mt-4">
      <p className="text-sm text-text-muted">แสดงรายการ 30 วันล่าสุด</p>

      <SegmentTabs
        tabs={TABS}
        active={activeTab}
        onChange={(id) => setActiveTab(id as HistoryTab)}
      />

      {error && (
        <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">{error}</p>
      )}

      {activeTab === "deposit" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-inset px-4 py-3">
            <p className="text-xs text-text-muted">ฝากรวมช่วงนี้</p>
            <p className="text-xl font-black text-income">
              {loading ? "…" : formatCurrency(depositTotal)}
            </p>
            {!loading && <p className="text-xs text-text-muted">{deposits.length} รายการ</p>}
          </div>
          {loading ? (
            <p className="text-text-muted">กำลังโหลด...</p>
          ) : deposits.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">ยังไม่มีรายการฝากในช่วงนี้</p>
          ) : (
            <CashMovementListScroll>
              {deposits.map((row) => (
                <div
                  key={row.id}
                  className="tablet-touch-row flex items-center justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-text-main">ฝากเงินสด</p>
                    <p className="text-xs text-text-muted">
                      {formatDateShort(row.depositDate)}
                      {row.createdAt ? ` · ${formatDateTime(row.createdAt)}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-income">+{formatCurrency(row.amount)}</p>
                </div>
              ))}
            </CashMovementListScroll>
          )}
        </div>
      )}

      {activeTab === "withdraw" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-inset px-4 py-3">
            <p className="text-xs text-text-muted">ถอนรวมช่วงนี้</p>
            <p className="text-xl font-black text-expense">
              {loading ? "…" : formatWithdrawalAmount(withdrawTotal)}
            </p>
            {!loading && <p className="text-xs text-text-muted">{withdrawals.length} รายการ</p>}
          </div>
          {loading ? (
            <p className="text-text-muted">กำลังโหลด...</p>
          ) : withdrawals.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">ยังไม่มีรายการถอนในช่วงนี้</p>
          ) : (
            <CashMovementListScroll>
              {withdrawals.map((row) => (
                <div
                  key={row.id}
                  className="tablet-touch-row flex items-start justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-text-main">ถอนเงินสด</p>
                    <p className="text-xs text-text-muted">
                      {formatDateShort(row.withdrawalDate)}
                      {row.createdAt ? ` · ${formatDateTime(row.createdAt)}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-expense">
                    {formatWithdrawalAmount(row.amount)}
                  </p>
                </div>
              ))}
            </CashMovementListScroll>
          )}
        </div>
      )}
    </div>
  );
}
