"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { fetchCategories } from "@/lib/api/client";
import { submitTransaction } from "@/lib/api/submitTransaction";
import type { Category } from "@/types";

export default function AddExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories("expense")
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="เพิ่มรายจ่าย">
        <p className="text-center text-text-muted py-12">กำลังโหลดหมวดหมู่...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="เพิ่มรายจ่าย">
      <TransactionForm
        type="expense"
        categories={categories}
        onCancel={() => router.back()}
        successRedirect="/expense"
        onSubmit={async (data) => {
          await submitTransaction(data);
        }}
      />
    </AppLayout>
  );
}
