import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { mockCategories } from "@/data/mock";

export default function AddExpensePage() {
  return (
    <AppLayout title="เพิ่มรายจ่าย">
      <div className="mx-auto max-w-xl">
        <TransactionForm type="expense" categories={mockCategories} />
      </div>
    </AppLayout>
  );
}
