"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { mockCategories } from "@/data/mock";

export default function AddExpensePage() {
  const router = useRouter();

  return (
    <AppLayout title="เพิ่มรายจ่าย">
      <TransactionForm
        type="expense"
        categories={mockCategories}
        onCancel={() => router.back()}
      />
    </AppLayout>
  );
}
