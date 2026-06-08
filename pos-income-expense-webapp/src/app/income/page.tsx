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
import { useTransactions } from "@/hooks/useTransactions";
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
  const { transactions, categories, loading, error, reload } = useTransactions("income");

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
      <div className="flex flex-col gap-4 xl:h-[calc(100vh-8rem)] xl:max-h-[calc(100vh-8rem)] xl:overflow-hidden">
        {error && (
          <p className="shrink-0 rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error} — ตรวจสอบว่ารัน SQL schema และ seed ใน Supabase แล้ว
          </p>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(340px,420px)_1fr] xl:gap-6 xl:items-stretch">
          {/* ซ้าย: สรุป + ใบเสร็จ */}
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
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

            <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden xl:min-h-0">
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

          {/* ขวา: รายการรายรับ — ความสูงเท่ากรอบใบเสร็จ, scroll ภายใน */}
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
            <div className="flex shrink-0 items-center gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="ค้นหารายการรายรับ..."
                wrapperClassName="flex-1"
              />
              <Link href="/income/add">
                <Button variant="income" size="lg" className="gap-1 whitespace-nowrap px-4">
                  <ArrowUpCircle size={20} />
                  เพิ่ม
                </Button>
              </Link>
            </div>

            <Card className="flex min-h-[360px] flex-1 flex-col overflow-hidden xl:min-h-0">
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
                    title="ไม่พบรายการ"
                    message={
                      search
                        ? `ไม่พบ "${search}" ในรายการรายรับ`
                        : "ยังไม่มีรายรับ — เริ่มบันทึกรายการแรก"
                    }
                    actionHref="/income/add"
                    actionLabel="+ เพิ่มรายรับ"
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
