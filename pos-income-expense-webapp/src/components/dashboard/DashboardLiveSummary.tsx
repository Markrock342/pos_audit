"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DailyCloseStatusCard } from "@/components/cash-count/DailyCloseStatusCard";
import { PosAccountSummaryCard } from "@/components/dashboard/PosAccountSummaryCard";
import { SummaryCards } from "@/components/SummaryCards";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/api/client";
import type { DailyCloseStatus, DailyLedgerSummary, DashboardSummary } from "@/types";

type DashboardApiData = {
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  netProfit: number;
  transactionCount: number;
  expectedCashBalance: number;
  dailyCloseStatus: DailyCloseStatus;
};

interface DashboardLiveSummaryProps {
  initialSummary: DashboardSummary;
  initialStatus: DailyCloseStatus;
  initialLedger: DailyLedgerSummary | null;
}

export function DashboardLiveSummary({
  initialSummary,
  initialStatus,
  initialLedger,
}: DashboardLiveSummaryProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState(initialStatus);
  const [ledger, setLedger] = useState(initialLedger);

  const refresh = useCallback(async () => {
    try {
      const [dashRes, ledgerRes] = await Promise.all([
        fetch("/api/reports/dashboard", { cache: "no-store" }),
        fetch("/api/daily-close/today", { cache: "no-store" }),
      ]);
      if (dashRes.ok) {
        const { data } = (await dashRes.json()) as { data: DashboardApiData };
        setSummary({
          todayIncome: data.todayIncome,
          todayExpense: data.todayExpense,
          monthIncome: data.monthIncome,
          monthExpense: data.monthExpense,
          netProfit: data.netProfit,
          transactionCount: data.transactionCount,
          expectedCashBalance: data.expectedCashBalance,
        });
        setStatus(data.dailyCloseStatus);
      }
      if (ledgerRes.ok) {
        const { data } = (await ledgerRes.json()) as { data: DailyLedgerSummary };
        setLedger(data);
      }
    } catch {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    };
  }, [refresh]);

  return (
    <>
      <div className="pos-stat-compact shrink-0">
        <SummaryCards summary={summary} dailyCloseStatus={status} />
      </div>
      <div className="shrink-0">
        <PosAccountSummaryCard ledger={ledger} status={status} />
      </div>
      <div className="shrink-0">
        <DailyCloseStatusCard status={status} />
      </div>
    </>
  );
}
