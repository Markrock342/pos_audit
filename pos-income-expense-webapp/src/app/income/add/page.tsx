"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { mockCategories } from "@/data/mock";

export default function AddIncomePage() {
  const router = useRouter();

  return (
    <AppLayout title="เพิ่มรายรับ">
      <TransactionForm
        type="income"
        categories={mockCategories}
        onCancel={() => router.back()}
      />
    </AppLayout>
  );
}
