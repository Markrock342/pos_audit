"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { getCategories } from "@/lib/store";

export default function AddExpensePage() {
  const router = useRouter();

  return (
    <AppLayout title="เพิ่มรายจ่าย">
      <TransactionForm
        type="expense"
        categories={getCategories()}
        onCancel={() => router.back()}
      />
    </AppLayout>
  );
}
