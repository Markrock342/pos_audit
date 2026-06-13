"use client";

import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { CashWithdrawal } from "@/types";
import { ArrowDownCircle, History } from "lucide-react";

interface CashWithdrawTodayPanelProps {
  items: CashWithdrawal[];
  totalWithdrawn: number;
  count: number;
  loading?: boolean;
  readOnly?: boolean;
  onWithdrawClick: () => void;
}

export function CashWithdrawTodayPanel({
  items,
  totalWithdrawn,
  count,
  loading,
  readOnly,
  onWithdrawClick,
}: CashWithdrawTodayPanelProps) {
  return (
    <div className="rounded-2xl border-2 border-border-default bg-surface-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-text-main">
            <ArrowDownCircle size={18} className="text-expense" />
            ถอนเงินออกจาก POS วันนี้
          </p>
          <p className="mt-1 text-xs text-text-muted">
            ลดยอดเงินสดในเครื่อง — ไม่กระทบยอดโอน · ไม่เปิดลิ้นชัก
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={onWithdrawClick}
            className="rounded-xl bg-expense px-4 py-2 text-sm font-bold text-white active:opacity-90"
          >
            ถอนเงิน
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-surface-inset px-4 py-3">
        <p className="text-sm text-text-muted">ถอนรวมวันนี้</p>
        <p className="text-2xl font-black text-expense">
          {loading ? "…" : `−${formatCurrency(totalWithdrawn)}`}
        </p>
        {!loading && count > 0 && (
          <p className="mt-0.5 text-xs text-text-muted">{count} ครั้ง</p>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-text-muted">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">ยังไม่มีการถอนวันนี้</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border-default px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-main">{row.note}</p>
                <p className="text-xs text-text-muted">
                  {row.createdAt ? formatDateTime(row.createdAt) : "-"}
                </p>
              </div>
              <p className="shrink-0 font-bold text-expense">−{formatCurrency(row.amount)}</p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/cash-count/withdrawals"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
      >
        <History size={16} />
        ดูประวัติการถอนย้อนหลัง
      </Link>
    </div>
  );
}
