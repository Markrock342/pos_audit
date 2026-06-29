"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { fetchCashCounts } from "@/lib/api/client";

import {

  cashCountDisplayBadgeClass,

  getCashCountDisplayLabel,

  isCashCountPending,

} from "@/lib/utils/cashCountVariance";

import { formatCurrency, formatDateShort } from "@/lib/utils/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import type { CashCount } from "@/types";

import { cn } from "@/lib/utils/cn";

import { History, CheckCircle, AlertTriangle, Lock, CircleDashed, ChevronRight } from "lucide-react";



interface CashCountHistoryProps {

  refreshKey?: number;

  /** ส่งจาก page-data — ไม่ต้อง fetch ซ้ำ */

  items?: CashCount[];

  loading?: boolean;

}



export function CashCountHistory({

  refreshKey = 0,

  items: itemsProp,

  loading: loadingProp,

}: CashCountHistoryProps) {

  const [history, setHistory] = useState<CashCount[]>(itemsProp ?? []);

  const [loading, setLoading] = useState(loadingProp ?? !itemsProp);



  useEffect(() => {

    if (itemsProp !== undefined) {

      setHistory(itemsProp);

      setLoading(loadingProp ?? false);

      return;

    }

    setLoading(true);

    fetchCashCounts(60)

      .then((rows) => setHistory([...rows].sort((a, b) => b.countDate.localeCompare(a.countDate))))

      .catch(() => setHistory([]))

      .finally(() => setLoading(false));

  }, [refreshKey, itemsProp, loadingProp]);



  return (

    <Card className="flex flex-col">

      <CardHeader className="shrink-0">

        <CardTitle className="flex items-center gap-2">

          <History size={22} className="text-text-muted" />

          ประวัติปิดยอดย้อนหลัง

        </CardTitle>

      </CardHeader>

      <CardContent>

        {loading ? (

          <p className="text-text-muted">กำลังโหลด...</p>

        ) : history.length === 0 ? (

          <p className="py-4 text-center text-text-muted">ยังไม่มีประวัติปิดยอด</p>

        ) : (

          <div className="space-y-2">

            {history.map((row) => (

              <Link

                key={row.id}

                href={`/cash-count/${row.countDate}`}

                className="tablet-touch-row flex items-center justify-between gap-4 rounded-2xl border-2 border-border-default px-4 transition-colors hover:border-brand hover:bg-brand/5 active:scale-[0.99]"

              >

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <p className="font-bold text-text-main">{formatDateShort(row.countDate)}</p>

                    {row.closedAt && (

                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-2 py-0.5 text-xs text-text-muted">

                        <Lock size={12} />

                        ปิดแล้ว

                      </span>

                    )}

                    {row.autoClosed && (

                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">

                        ปิดอัตโนมัติ

                      </span>

                    )}

                    {(row.closeEditGeneration ?? 0) > 1 && (

                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">

                        มีการแก้ไข

                      </span>

                    )}

                    {row.closeEditReopenedAt && !row.closedAt && (

                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">

                        กำลังแก้ไข

                      </span>

                    )}

                  </div>

                  <p className="text-sm text-text-muted">
                    คำนวณ {formatCurrency(row.expectedBalance)}

                    {isCashCountPending(row)

                      ? " · ยังไม่ได้นับ"

                      : ` → นับ ${formatCurrency(row.actualBalance)}`}

                  </p>

                  {!isCashCountPending(row) && row.status !== "balanced" && (

                    <p className="text-xs text-text-muted">

                      ส่วนต่าง: {row.variance >= 0 ? "+" : ""}

                      {formatCurrency(row.variance)}

                    </p>

                  )}

                </div>

                <div

                  className={cn(

                    "flex max-w-[9rem] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold leading-tight sm:max-w-none sm:text-sm",

                    cashCountDisplayBadgeClass(row)

                  )}

                >

                  {isCashCountPending(row) ? (

                    <CircleDashed size={18} className="shrink-0" />

                  ) : row.status === "balanced" ? (

                    <CheckCircle size={18} className="shrink-0" />

                  ) : (

                    <AlertTriangle size={18} className="shrink-0" />

                  )}

                  {getCashCountDisplayLabel(row)}

                  <ChevronRight size={16} className="shrink-0 opacity-60" />

                </div>

              </Link>

            ))}

          </div>

        )}

      </CardContent>

    </Card>

  );

}


