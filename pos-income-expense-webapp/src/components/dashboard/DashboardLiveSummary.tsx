"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PosAccountSummaryCard } from "@/components/dashboard/PosAccountSummaryCard";
import { SummaryCards } from "@/components/SummaryCards";
import { DASHBOARD_REFRESH_EVENT, fetchDashboardRefresh } from "@/lib/api/client";
import type { DailyCloseStatus, DailyLedgerSummary, DashboardSummary } from "@/types";

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
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState(initialStatus);
  const [ledger, setLedger] = useState(initialLedger);
  const refreshInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      const data = await fetchDashboardRefresh();
      setSummary(data.summary);
      setStatus(data.status);
      setLedger(data.ledger);
    } catch {
      /* keep last good data */
    } finally {
      refreshInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const onDashboardRefresh = () => {
      void refresh();
    };
    window.addEventListener(DASHBOARD_REFRESH_EVENT, onDashboardRefresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, onDashboardRefresh);
  }, [refresh]);

  return (
    <>
      <div className="pos-stat-compact shrink-0">
        <SummaryCards summary={summary} />
      </div>
      <div className="shrink-0">
        <PosAccountSummaryCard ledger={ledger} status={status} />
      </div>
    </>
  );
}
