"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { CloseEditModeBanner } from "@/components/cash-count/CloseEditModeBanner";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { ExpenseVoucherPreview } from "@/components/ExpenseVoucherPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActiveDayTransactions } from "@/hooks/useActiveDayTransactions";
import { formatCurrency } from "@/lib/utils/format";
import type { Transaction } from "@/types";
import { ArrowDownCircle, TrendingDown, CreditCard } from "lucide-react";

function sortNewestFirst(items: Transaction[]): Transaction[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function ExpenseListPage() {
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { transactions, categories, loading, error, dayCleared, inCloseEditMode, reload } =
    useActiveDayTransactions("expense");

  const filtered = useMemo(() => {
    const list = search
      ? transactions.filter(
          (t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.note?.toLowerCase().includes(search.toLowerCase())
        )
      : transactions;
    return sortNewestFirst(list.filter((t) => t.status === "active"));
  }, [transactions, search]);

  const totalExpense = filtered.reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    setSelectedTransaction((prev) => {
      if (filtered.length === 0) return null;
      if (prev && filtered.some((t) => t.id === prev.id)) return prev;
      return filtered[0];
    });
  }, [filtered]);

  return (
    <AppLayout title="รายจ่าย">
      <div className="pos-page flex flex-col gap-4">
        {error && (
          <p className="shrink-0 rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error} — ตรวจสอบว่ารัน SQL schema และ seed ใน Supabase แล้ว
          </p>
        )}

        {inCloseEditMode && <CloseEditModeBanner />}

        <Card className="shrink-0 border-t-4 border-t-expense 2xl:hidden">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text-secondary">ยอดรวมรายจ่าย</p>
                <p className="text-3xl font-black text-expense">
                  {loading ? "..." : formatCurrency(totalExpense)}
                </p>
                <p className="mt-1 text-sm font-bold text-expense">
                  {loading ? "..." : `${filtered.length} รายการ`}
                </p>
              </div>
              {!dayCleared && (
                <Link href="/expense/add">
                  <Button variant="danger" size="lg" className="min-h-[56px] gap-2 px-5">
                    <ArrowDownCircle size={22} />
                    เพิ่ม
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden 2xl:grid-cols-[minmax(340px,420px)_1fr] 2xl:gap-6 2xl:items-stretch">
          {/* ซ้าย: สรุป + ใบบันทึกรายจ่าย (desktop) */}
          <div className="hidden min-h-0 flex-col gap-4 overflow-hidden 2xl:flex">
            <Card className="shrink-0 border-t-4 border-t-expense">
              <CardContent className="py-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-expense-light">
                    <CreditCard size={22} className="text-expense" />
                  </div>
                  <p className="text-base font-bold text-text-secondary">ยอดรวมรายจ่าย</p>
                </div>
                <p className="text-4xl font-black tracking-tight text-expense">
                  {loading ? "..." : formatCurrency(totalExpense)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-expense">
                  <TrendingDown size={16} />
                  <span>{loading ? "..." : `${filtered.length} รายการ`}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden 2xl:min-h-0">
              {selectedTransaction ? (
                <ExpenseVoucherPreview
                  fill
                  compact
                  transaction={selectedTransaction}
                  categories={categories}
                />
              ) : (
                <Card className="flex h-full flex-col items-center justify-center border-dashed">
                  <CardContent className="text-center text-text-muted">
                    <p className="text-base font-semibold">ยังไม่มีใบบันทึกที่เลือก</p>
                    <p className="mt-1 text-sm">เลือกรายการจากตารางด้านขวา</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* ขวา: รายการรายจ่าย */}
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
            <div className="hidden shrink-0 items-center gap-3 2xl:flex">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="ค้นหารายการรายจ่าย..."
                wrapperClassName="flex-1"
              />
              {!dayCleared && (
                <Link href="/expense/add">
                  <Button variant="danger" size="lg" className="gap-2 whitespace-nowrap px-4">
                    <ArrowDownCircle size={20} />
                    เพิ่ม
                  </Button>
                </Link>
              )}
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="ค้นหารายการรายจ่าย..."
              wrapperClassName="shrink-0 2xl:hidden"
            />

            {selectedTransaction && (
              <details className="shrink-0 overflow-hidden rounded-2xl border-2 border-expense/30 bg-expense-light/20 2xl:hidden">
                <summary className="tablet-touch-chip flex cursor-pointer list-none items-center justify-between px-4 py-3 font-bold text-expense [&::-webkit-details-marker]:hidden">
                  <span>ดูใบบันทึก — {selectedTransaction.title}</span>
                  <span className="text-sm font-bold text-text-muted">แตะเพื่อเปิด/ปิด</span>
                </summary>
                <div className="max-h-[45vh] overflow-y-auto border-t border-expense/20 p-2">
                  <ExpenseVoucherPreview
                    compact
                    transaction={selectedTransaction}
                    categories={categories}
                  />
                </div>
              </details>
            )}

            <Card className="flex min-h-[360px] flex-1 flex-col overflow-hidden 2xl:min-h-0">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <ArrowDownCircle size={22} className="text-expense" />
                  รายการรายจ่าย
                </CardTitle>
                <p className="text-xs text-text-muted">
                  ใหม่สุดอยู่บนสุด · แตะแถวหรือไอคอนใบบันทึกเพื่อดู
                </p>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
                {loading ? (
                  <p className="py-12 text-center text-text-muted">กำลังโหลด...</p>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    title={dayCleared ? "ปิดยอดแล้ว" : "ไม่พบรายการ"}
                    message={
                      dayCleared
                        ? "รายการวันนี้ถูกเคลียร์ — เปิดแก้ไขปิดยอดที่หน้าสรุปปิดยอดเพื่อดู/แก้ไข"
                        : search
                          ? `ไม่พบ "${search}" ในรายการรายจ่าย`
                          : "ยังไม่มีรายจ่าย — เริ่มบันทึกรายการแรก"
                    }
                    actionHref={dayCleared ? undefined : "/expense/add"}
                    actionLabel={dayCleared ? undefined : "+ เพิ่มรายจ่าย"}
                  />
                ) : (
                  <TransactionTable
                    transactions={filtered}
                    categories={categories}
                    onChanged={reload}
                    onPreviewReceipt={setSelectedTransaction}
                    onSelectTransaction={setSelectedTransaction}
                    selectedTransactionId={selectedTransaction?.id}
                    highlightVariant="expense"
                    stickyHeader
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
