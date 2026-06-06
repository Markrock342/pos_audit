import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { mockCategories } from "@/data/mock";

export default function AddIncomePage() {
  return (
    <AppLayout title="เพิ่มรายรับ">
      <div className="mx-auto max-w-xl">
        <TransactionForm type="income" categories={mockCategories} />
      </div>
    </AppLayout>
  );
}
