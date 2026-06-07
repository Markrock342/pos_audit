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
import { mockCategories, mockTransactions } from "@/data/mock";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowUpCircle, TrendingUp, Wallet } from "lucide-react";

export default function IncomeListPage() {
  const [search, setSearch] = useState("");
  const incomeTransactions = mockTransactions.filter((t) => t.type === "income");
  const filtered = search
    ? incomeTransactions.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.note?.toLowerCase().includes(search.toLowerCase())
      )
    : incomeTransactions;
  const totalIncome = filtered.reduce((sum, t) => sum + t.amount, 0);
  const sampleTransaction = incomeTransactions[0];

  return (
    <AppLayout title="รายรับ">
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 border-t-4 border-t-income">
            <CardContent className="flex flex-col justify-center min-h-[160px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-income-light shadow-sm">
                  <Wallet size={24} className="text-income" />
                </div>
                <p className="text-lg font-bold text-text-secondary">ยอดรวมรายรับทั้งหมด</p>
              </div>
              <p className="text-5xl font-black text-income tracking-tight">{formatCurrency(totalIncome)}</p>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-income">
                <TrendingUp size={18} />
                <span>{filtered.length} รายการ</span>
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
                <Button size="lg" className="gap-2 whitespace-nowrap">
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
                {filtered.length === 0 ? (
                  <EmptyState
                    title="ไม่พบรายการ"
                    message={`ไม่พบ "${search}" ในรายการรายรับ`}
                    actionHref="/income/add"
                    actionLabel="+ เพิ่มรายรับ"
                  />
                ) : (
                  <TransactionTable
                    transactions={filtered}
                    categories={mockCategories}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {sampleTransaction && (
          <ReceiptPreview
            transaction={sampleTransaction}
            receipt={{
              id: "rcpt-1",
              transactionId: sampleTransaction.id,
              receiptNumber: "RCP-2026-0001",
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
