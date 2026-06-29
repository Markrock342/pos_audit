"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { CloseEditRoundDashboard } from "@/components/cash-count/CloseEditRoundViews";
import { fetchCloseHistoryForDate } from "@/lib/api/client";
import { formatDateShort } from "@/lib/utils/format";
import { findCloseEditRound } from "@/lib/utils/closeEditRounds";
import type { CloseEditRound } from "@/lib/utils/closeEditRounds";
import { ArrowLeft } from "lucide-react";

export default function CloseEditRoundPage() {
  const params = useParams<{ date: string; generation: string }>();
  const date = params.date ?? "";
  const generation = Number(params.generation);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const validGen = Number.isInteger(generation) && generation >= 0;

  const [round, setRound] = useState<CloseEditRound | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!validDate || !validGen) {
      setError("ลิงก์ไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCloseHistoryForDate(date);
      const found = findCloseEditRound(data, generation);
      if (!found) {
        setError("ไม่พบรอบแก้ไขนี้");
        setRound(undefined);
      } else {
        setRound(found);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setRound(undefined);
    } finally {
      setLoading(false);
    }
  }, [date, generation, validDate, validGen]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppLayout
      title={round ? `แก้ไขปิดยอด รอบที่ ${round.roundNumber}` : "รายละเอียดแก้ไขปิดยอด"}
      subtitle={validDate ? formatDateShort(date) : undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <Link
            href={`/cash-count/${date}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
          >
            <ArrowLeft size={16} />
            กลับหน้าปิดยอดวันนั้น
          </Link>
          {round && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                round.inProgress
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                  : "bg-surface-inset text-text-muted"
              }`}
            >
              {round.inProgress ? "กำลังแก้ไข" : "แก้ไขเสร็จแล้ว"}
              {" · "}
              {round.editCount} รายการ
            </span>
          )}
        </div>

        {error && (
          <p className="shrink-0 rounded-xl bg-error-light px-4 py-2 text-sm font-bold text-error">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-text-muted">กำลังโหลด...</p>
        ) : round ? (
          <CloseEditRoundDashboard round={round} />
        ) : null}
      </div>
    </AppLayout>
  );
}
