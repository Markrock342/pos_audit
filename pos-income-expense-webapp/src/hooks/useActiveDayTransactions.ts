"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, Transaction } from "@/types";
import {
  DASHBOARD_REFRESH_EVENT,
  fetchActiveDayListPage,
  readActiveDayListPageCache,
} from "@/lib/api/client";

/** รายการรายรับ/รายจ่ายวันนี้ — ซ่อนเมื่อปิดยอดแล้ว โชว์กลับเมื่อเปิดแก้ไขปิดยอด */
export function useActiveDayTransactions(type: "income" | "expense") {
  const cached = readActiveDayListPageCache(type);
  const [transactions, setTransactions] = useState<Transaction[]>(cached?.transactions ?? []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [dayCleared, setDayCleared] = useState(cached?.dayCleared ?? false);
  const [inCloseEditMode, setInCloseEditMode] = useState(cached?.inCloseEditMode ?? false);
  const hasLoadedRef = useRef(!!cached);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent && hasLoadedRef.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const {
          transactions: txns,
          categories: cats,
          dayCleared: cleared,
          inCloseEditMode: editing,
        } = await fetchActiveDayListPage(type);
        setDayCleared(cleared);
        setInCloseEditMode(editing);
        setTransactions(txns);
        setCategories(cats);
        hasLoadedRef.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
        if (!silent && !hasLoadedRef.current) {
          setTransactions([]);
          setCategories([]);
          setDayCleared(false);
          setInCloseEditMode(false);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    hasLoadedRef.current = !!readActiveDayListPageCache(type);
    void load({ silent: hasLoadedRef.current });
  }, [load, type]);

  useEffect(() => {
    const refresh = () => void load({ silent: true });
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  return {
    transactions,
    categories,
    loading,
    error,
    dayCleared,
    inCloseEditMode,
    reload: () => load(),
  };
}
