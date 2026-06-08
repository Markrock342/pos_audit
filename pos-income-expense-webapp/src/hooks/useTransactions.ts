"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Transaction } from "@/types";
import { fetchCategories, fetchTransactions } from "@/lib/api/client";

export function useTransactions(type?: "income" | "expense") {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txns, cats] = await Promise.all([
        fetchTransactions(type),
        fetchCategories(),
      ]);
      setTransactions(txns);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      setTransactions([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return { transactions, categories, loading, error, reload: load };
}
