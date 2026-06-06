import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mockCategories, mockTransactions } from "@/data/mock";
import { formatCurrency } from "@/lib/utils/format";

export default function ExpenseListPage() {
  const expenseTransactions = mockTransactions.filter((t) => t.type === "expense");
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout title="รายจ่าย">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">ยอดรวมรายจ่ายทั้งหมด</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
          </div>
          <Link href="/expense/add">
            <Button>+ เพิ่มรายจ่าย</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายการรายจ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTable
              transactions={expenseTransactions}
              categories={mockCategories}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
