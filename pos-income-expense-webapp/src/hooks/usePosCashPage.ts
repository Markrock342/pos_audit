"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CashDeposit, CashWithdrawal } from "@/types";
import {
  DASHBOARD_REFRESH_EVENT,
  fetchPosCashPageData,
  invalidatePosCashPageCache,
  POS_CASH_PAGE_CACHE_KEY,
  type PosCashPageData,
} from "@/lib/api/client";

function readCache(): PosCashPageData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POS_CASH_PAGE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as PosCashPageData) : null;
  } catch {
    return null;
  }
}

function writeCache(data: PosCashPageData) {
  try {
    sessionStorage.setItem(POS_CASH_PAGE_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function usePosCashPage() {
  const cached = readCache();
  const [readOnly, setReadOnly] = useState(cached?.readOnly ?? false);
  const [dayCleared, setDayCleared] = useState(cached?.dayCleared ?? false);
  const [inCloseEditMode, setInCloseEditMode] = useState(cached?.inCloseEditMode ?? false);
  const [deposits, setDeposits] = useState<CashDeposit[]>(cached?.deposits ?? []);
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>(cached?.withdrawals ?? []);
  const [depositTotal, setDepositTotal] = useState(cached?.depositTotal ?? 0);
  const [withdrawTotal, setWithdrawTotal] = useState(cached?.withdrawTotal ?? 0);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [statusReady, setStatusReady] = useState(!!cached);
  const hasLoadedRef = useRef(!!cached);

  const applyData = useCallback((data: PosCashPageData) => {
    setReadOnly(data.readOnly);
    setDayCleared(data.dayCleared);
    setInCloseEditMode(data.inCloseEditMode);
    setDeposits(data.deposits);
    setWithdrawals(data.withdrawals);
    setDepositTotal(data.depositTotal);
    setWithdrawTotal(data.withdrawTotal);
    writeCache(data);
    hasLoadedRef.current = true;
  }, []);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent && hasLoadedRef.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchPosCashPageData();
        applyData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
        if (!silent && !hasLoadedRef.current) {
          setDeposits([]);
          setWithdrawals([]);
          setDepositTotal(0);
          setWithdrawTotal(0);
          setReadOnly(false);
          setDayCleared(false);
          setInCloseEditMode(false);
        }
      } finally {
        if (!silent) setLoading(false);
        setStatusReady(true);
      }
    },
    [applyData]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => void load({ silent: true });
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  const reloadAfterMovement = useCallback(async () => {
    invalidatePosCashPageCache();
    await load({ silent: true });
  }, [load]);

  return {
    readOnly,
    dayCleared,
    inCloseEditMode,
    deposits,
    withdrawals,
    depositTotal,
    withdrawTotal,
    loading,
    error,
    statusReady,
    reloadAfterMovement,
  };
}
