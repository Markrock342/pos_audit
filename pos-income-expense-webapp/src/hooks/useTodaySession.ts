"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDailyCloseToday } from "@/lib/api/client";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { isTodayBusinessClosed } from "@/lib/utils/activeDayDisplay";
import type { DailyLedgerSummary } from "@/types";

export function useTodaySession() {
  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDailyCloseToday();
      setLedger(data);
    } catch {
      setLedger(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const businessToday = ledger?.businessToday ?? ledger?.countDate ?? getBusinessToday();
  const isClosed = ledger ? isTodayBusinessClosed({
    countDate: ledger.countDate,
    isLocked: ledger.isLocked,
    closedAt: ledger.closedAt,
    hasManualCount: true,
    cashClosing: ledger.cash.closing,
    transferClosing: ledger.transfer.closing,
    netTotal: ledger.business.netTotal,
  }) : false;

  return {
    ledger,
    loading,
    reload: load,
    businessToday,
    isClosed,
  };
}
