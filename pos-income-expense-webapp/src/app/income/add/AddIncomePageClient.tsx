"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { submitTransaction } from "@/lib/api/submitTransaction";
import type { Category } from "@/types";

interface AddIncomePageClientProps {
  categories: Category[];
}

export function AddIncomePageClient({ categories }: AddIncomePageClientProps) {
  const router = useRouter();

  return (
    <AppLayout title="เพิ่มรายรับ">
      <TransactionForm
        type="income"
        categories={categories}
        onCancel={() => router.back()}
        successRedirect="/income"
        onSubmit={async (data) => {
          await submitTransaction(data);
        }}
      />
    </AppLayout>
  );
}
