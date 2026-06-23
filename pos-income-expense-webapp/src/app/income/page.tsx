"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActiveDayTransactions } from "@/hooks/useActiveDayTransactions";
import { formatCurrency } from "@/lib/utils/format";
import { resolveReceiptNumber } from "@/lib/utils/receiptFormat";
import type { Transaction } from "@/types";
import { ArrowUpCircle, TrendingUp, Wallet } from "lucide-react";

function sortNewestFirst(items: Transaction[]): Transaction[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function IncomeListPage() {
  const [search, setSearch] = useState("");
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const { transactions, categories, loading, error, dayCleared, reload } =
    useActiveDayTransactions("income");

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

  const totalIncome = filtered.reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    setReceiptTransaction((prev) => {
      if (filtered.length === 0) return null;
      if (prev && filtered.some((t) => t.id === prev.id)) return prev;
      return filtered[0];
    });
  }, [filtered]);

  return (
    <AppLayout title="รายรับ">
      <div className="pos-page flex flex-col gap-4">
        {error && (
          <p className="shrink-0 rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error} — ตรวจสอบว่ารัน SQL schema และ seed ใน Supabase แล้ว
          </p>
        )}

        {dayCleared && (
          <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
            ปิดยอดแล้ว — รายการวันนี้ถูกเคลียร์ · แก้ไขได้ที่ สรุปปิดยอด → แก้ไขปิดยอด (PIN)
          </p>
        )}

        <Card className="shrink-0 border-t-4 border-t-income 2xl:hidden">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text-secondary">ยอดรวมรายรับ</p>
                <p className="text-3xl font-black text-income">
                  {loading ? "..." : formatCurrency(totalIncome)}
                </p>
                <p className="mt-1 text-sm font-bold text-income">
                  {loading ? "..." : `${filtered.length} รายการ`}
                </p>
              </div>
              {!dayCleared && (
                <Link href="/income/add">
                  <Button variant="income" size="lg" className="min-h-[56px] gap-2 px-5">
                    <ArrowUpCircle size={22} />
                    เพิ่ม
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden 2xl:grid-cols-[minmax(340px,420px)_1fr] 2xl:gap-6 2xl:items-stretch">
          {/* ซ้าย: สรุป + ใบเสร็จ (desktop) */}
          <div className="hidden min-h-0 flex-col gap-4 overflow-hidden 2xl:flex">
            <Card className="shrink-0 border-t-4 border-t-income">
              <CardContent className="py-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-income-light">
                    <Wallet size={22} className="text-income" />
                  </div>
                  <p className="text-base font-bold text-text-secondary">ยอดรวมรายรับ</p>
                </div>
                <p className="text-4xl font-black tracking-tight text-income">
                  {loading ? "..." : formatCurrency(totalIncome)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-income">
                  <TrendingUp size={16} />
                  <span>{loading ? "..." : `${filtered.length} รายการ`}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden 2xl:min-h-0">
              {receiptTransaction ? (
                <ReceiptPreview
                  fill
                  compact
                  transaction={receiptTransaction}
                  receipt={{
                    id: "preview",
                    transactionId: receiptTransaction.id,
                    receiptNumber: resolveReceiptNumber(receiptTransaction),
                  }}
                />
              ) : (
                <Card className="flex h-full flex-col items-center justify-center border-dashed">
                  <CardContent className="text-center text-text-muted">
                    <p className="text-base font-semibold">ยังไม่มีใบเสร็จที่เลือก</p>
                    <p className="mt-1 text-sm">เลือกรายการจากตารางด้านขวา</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* ขวา: รายการรายรับ */}
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
            <div className="hidden shrink-0 items-center gap-3 2xl:flex">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="ค้นหารายการรายรับ..."
                wrapperClassName="flex-1"
              />
              {!dayCleared && (
                <Link href="/income/add">
                  <Button variant="income" size="lg" className="gap-1 whitespace-nowrap px-4">
                    <ArrowUpCircle size={20} />
                    เพิ่ม
                  </Button>
                </Link>
              )}
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="ค้นหารายการรายรับ..."
              wrapperClassName="shrink-0 2xl:hidden"
            />

            {receiptTransaction && (
              <details className="shrink-0 overflow-hidden rounded-2xl border-2 border-income/30 bg-income-light/20 2xl:hidden">
                <summary className="tablet-touch-chip flex cursor-pointer list-none items-center justify-between px-4 py-3 font-bold text-income [&::-webkit-details-marker]:hidden">
                  <span>ดูใบเสร็จ — {receiptTransaction.title}</span>
                  <span className="text-sm font-bold text-text-muted">แตะเพื่อเปิด/ปิด</span>
                </summary>
                <div className="max-h-[45vh] overflow-y-auto border-t border-income/20 p-2">
                  <ReceiptPreview
                    compact
                    transaction={receiptTransaction}
                    receipt={{
                      id: "preview",
                      transactionId: receiptTransaction.id,
                      receiptNumber: resolveReceiptNumber(receiptTransaction),
                    }}
                  />
                </div>
              </details>
            )}

            <Card className="flex min-h-[360px] flex-1 flex-col overflow-hidden 2xl:min-h-0">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <ArrowUpCircle size={22} className="text-income" />
                  รายการรายรับ
                </CardTitle>
                <p className="text-xs text-text-muted">
                  ใหม่สุดอยู่บนสุด · แตะแถวหรือไอคอนใบเสร็จเพื่อดู
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
                          ? `ไม่พบ "${search}" ในรายการรายรับ`
                          : "ยังไม่มีรายรับ — เริ่มบันทึกรายการแรก"
                    }
                    actionHref={dayCleared ? undefined : "/income/add"}
                    actionLabel={dayCleared ? undefined : "+ เพิ่มรายรับ"}
                    actionVariant="income"
                  />
                ) : (
                  <TransactionTable
                    transactions={filtered}
                    categories={categories}
                    onChanged={reload}
                    onPreviewReceipt={setReceiptTransaction}
                    onSelectTransaction={setReceiptTransaction}
                    selectedTransactionId={receiptTransaction?.id}
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
