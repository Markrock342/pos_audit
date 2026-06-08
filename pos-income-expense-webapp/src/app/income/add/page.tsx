"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { fetchCategories } from "@/lib/api/client";
import { submitTransaction } from "@/lib/api/submitTransaction";
import type { Category } from "@/types";

export default function AddIncomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories("income")
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="เพิ่มรายรับ">
        <p className="text-center text-text-muted py-12">กำลังโหลดหมวดหมู่...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="เพิ่มรายรับ">
      <div className="mx-auto w-full max-w-6xl">
      <TransactionForm
        type="income"
        categories={categories}
        onCancel={() => router.back()}
        onSubmit={async (data) => {
          await submitTransaction(data);
          router.push("/income");
        }}
      />
      </div>
    </AppLayout>
  );
}
