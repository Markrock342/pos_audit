"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { getCategories } from "@/lib/store";

export default function AddIncomePage() {
  const router = useRouter();

  return (
    <AppLayout title="เพิ่มรายรับ">
      <TransactionForm
        type="income"
        categories={getCategories()}
        onCancel={() => router.back()}
      />
    </AppLayout>
  );
}
