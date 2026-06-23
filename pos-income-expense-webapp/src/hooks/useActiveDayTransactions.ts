"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, Transaction } from "@/types";
import { DASHBOARD_REFRESH_EVENT, fetchActiveDayListPage } from "@/lib/api/client";

/** รายการรายรับ/รายจ่ายวันนี้ — ซ่อนเมื่อปิดยอดแล้ว โชว์กลับเมื่อเปิดแก้ไขปิดยอด */
export function useActiveDayTransactions(type: "income" | "expense") {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayCleared, setDayCleared] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent && hasLoadedRef.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const { transactions: txns, categories: cats, dayCleared: cleared } =
          await fetchActiveDayListPage(type);
        setDayCleared(cleared);
        setTransactions(txns);
        setCategories(cats);
        hasLoadedRef.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
        if (!silent) {
          setTransactions([]);
          setCategories([]);
          setDayCleared(false);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => void load({ silent: true });
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  return { transactions, categories, loading, error, dayCleared, reload: () => load() };
}
