"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowDownCircle, TrendingDown, CreditCard } from "lucide-react";

export default function ExpenseListPage() {
  const [search, setSearch] = useState("");
  const { transactions, categories, loading, error, reload } = useTransactions("expense");

  const filtered = search
    ? transactions.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.note?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;
  const activeOnly = filtered.filter((t) => t.status === "active");
  const totalExpense = activeOnly.reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout title="รายจ่าย">
      <div className="space-y-6">
        {error && (
          <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error} — ตรวจสอบว่ารัน SQL schema และ seed ใน Supabase แล้ว
          </p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1 border-t-4 border-t-expense">
            <CardContent className="flex flex-col justify-center min-h-[160px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-expense-light shadow-sm">
                  <CreditCard size={24} className="text-expense" />
                </div>
                <p className="text-lg font-bold text-text-secondary">ยอดรวมรายจ่ายทั้งหมด</p>
              </div>
              <p className="text-5xl font-black text-expense tracking-tight">
                {loading ? "..." : formatCurrency(totalExpense)}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-expense">
                <TrendingDown size={18} />
                <span>{loading ? "..." : `${activeOnly.length} รายการ`}</span>
              </div>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="ค้นหารายการรายจ่าย..."
                wrapperClassName="flex-1"
              />
              <Link href="/expense/add">
                <Button variant="danger" size="lg" className="gap-2 whitespace-nowrap">
                  <ArrowDownCircle size={22} />
                  เพิ่มรายจ่าย
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <ArrowDownCircle size={22} className="text-expense" />
                  รายการรายจ่าย
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-text-muted py-12">กำลังโหลด...</p>
                ) : activeOnly.length === 0 ? (
                  <EmptyState
                    title="ไม่พบรายการ"
                    message={search ? `ไม่พบ "${search}" ในรายการรายจ่าย` : "ยังไม่มีรายจ่าย — เริ่มบันทึกรายการแรก"}
                    actionHref="/expense/add"
                    actionLabel="+ เพิ่มรายจ่าย"
                  />
                ) : (
                  <TransactionTable
                    transactions={activeOnly}
                    categories={categories}
                    onChanged={reload}
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
