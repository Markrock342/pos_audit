"use client";

import { useState } from "react";
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
import { ArrowUpCircle, TrendingUp, Wallet } from "lucide-react";

export default function IncomeListPage() {
  const [search, setSearch] = useState("");
  const { transactions, categories, loading, error } = useTransactions("income");

  const filtered = search
    ? transactions.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.note?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;
  const totalIncome = filtered.reduce((sum, t) => sum + t.amount, 0);
  const sampleTransaction = transactions[0];

  return (
    <AppLayout title="รายรับ">
      <div className="space-y-6">
        {error && (
          <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error} — ตรวจสอบว่ารัน SQL schema และ seed ใน Supabase แล้ว
          </p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 border-t-4 border-t-income">
            <CardContent className="flex flex-col justify-center min-h-[160px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-income-light shadow-sm">
                  <Wallet size={24} className="text-income" />
                </div>
                <p className="text-lg font-bold text-text-secondary">ยอดรวมรายรับทั้งหมด</p>
              </div>
              <p className="text-5xl font-black text-income tracking-tight">
                {loading ? "..." : formatCurrency(totalIncome)}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-income">
                <TrendingUp size={18} />
                <span>{loading ? "..." : `${filtered.length} รายการ`}</span>
              </div>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="ค้นหารายการรายรับ..."
                wrapperClassName="flex-1"
              />
              <Link href="/income/add">
                <Button variant="income" size="lg" className="gap-2 whitespace-nowrap">
                  <ArrowUpCircle size={22} />
                  เพิ่มรายรับ
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <ArrowUpCircle size={22} className="text-income" />
                  รายการรายรับ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-text-muted py-12">กำลังโหลด...</p>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    title="ไม่พบรายการ"
                    message={search ? `ไม่พบ "${search}" ในรายการรายรับ` : "ยังไม่มีรายรับ — เริ่มบันทึกรายการแรก"}
                    actionHref="/income/add"
                    actionLabel="+ เพิ่มรายรับ"
                    actionVariant="income"
                  />
                ) : (
                  <TransactionTable transactions={filtered} categories={categories} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {sampleTransaction && (
          <ReceiptPreview
            transaction={sampleTransaction}
            receipt={{
              id: "preview",
              transactionId: sampleTransaction.id,
              receiptNumber: sampleTransaction.receiptNo ?? `R-${sampleTransaction.id.slice(0, 8)}`,
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
