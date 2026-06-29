"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchCloseHistoryForDate } from "@/lib/api/client";
import { CloseEditRoundSummaryLine } from "@/components/cash-count/CloseEditRoundViews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CloseHistoryForDate } from "@/lib/services/db/closeEdit";
import { buildCloseEditRounds } from "@/lib/utils/closeEditRounds";
import { ChevronRight, History } from "lucide-react";

interface CashCountCloseEventsPanelProps {
  countDate: string;
  refreshKey?: number;
}

export function CashCountCloseEventsPanel({
  countDate,
  refreshKey = 0,
}: CashCountCloseEventsPanelProps) {
  const [history, setHistory] = useState<CloseHistoryForDate | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHistory(await fetchCloseHistoryForDate(countDate));
    } catch {
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [countDate]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const rounds = useMemo(
    () => (history ? buildCloseEditRounds(history) : []),
    [history]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History size={20} className="text-text-muted" />
          ประวัติแก้ไขปิดยอด
        </CardTitle>
        <p className="text-xs font-normal text-text-muted">
          แสดงเฉพาะวันที่มีการแก้ไขหลังปิดยอดแล้ว — กดดูรายละเอียดทุกรายการในแต่ละรอบ
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-text-muted">กำลังโหลด...</p>
        ) : rounds.length === 0 ? (
          <p className="py-2 text-center text-sm text-text-muted">
            วันนี้ปิดยอดโดยไม่มีการแก้ไข — ไม่มีประวัติรอบแก้ไข
          </p>
        ) : (
          <div className="space-y-2">
            {rounds.map((round) => (
              <Link
                key={round.reopenEvent.id}
                href={`/cash-count/${countDate}/edit-round/${round.generation}`}
                className="tablet-touch-row flex items-center gap-3 rounded-2xl border-2 border-border-default px-4 py-3 transition-colors hover:border-amber-500/60 hover:bg-amber-500/5 active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-sm font-black text-amber-700 dark:text-amber-300">
                  {round.roundNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-main">
                    รอบแก้ไขที่ {round.roundNumber}
                    {round.inProgress && (
                      <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        กำลังแก้ไข
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-text-muted">
                    <CloseEditRoundSummaryLine round={round} />
                  </p>
                </div>
                <ChevronRight size={20} className="shrink-0 text-text-muted" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
