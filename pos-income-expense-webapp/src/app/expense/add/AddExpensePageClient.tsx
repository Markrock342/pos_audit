"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { submitTransaction } from "@/lib/api/submitTransaction";
import { printTransactionDocument } from "@/lib/hardware/printTransactionDocument";
import type { Category } from "@/types";

interface AddExpensePageClientProps {
  categories: Category[];
}

export function AddExpensePageClient({ categories }: AddExpensePageClientProps) {
  const router = useRouter();

  return (
    <AppLayout title="เพิ่มรายจ่าย">
      <TransactionForm
        type="expense"
        categories={categories}
        onCancel={() => router.back()}
        successRedirect="/expense"
        onSubmit={async (data) => {
          const transaction = await submitTransaction(data);
          await printTransactionDocument(transaction, { categories });
        }}
      />
    </AppLayout>
  );
}
