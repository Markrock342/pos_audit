import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mockCategories, mockTransactions } from "@/data/mock";
import { formatCurrency } from "@/lib/utils/format";

export default function IncomeListPage() {
  const incomeTransactions = mockTransactions.filter((t) => t.type === "income");
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const sampleTransaction = incomeTransactions[0];

  return (
    <AppLayout title="รายรับ">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">ยอดรวมรายรับทั้งหมด</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
          </div>
          <Link href="/income/add">
            <Button>+ เพิ่มรายรับ</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายการรายรับ</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTable
              transactions={incomeTransactions}
              categories={mockCategories}
            />
          </CardContent>
        </Card>

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
