"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { submitTransaction } from "@/lib/api/submitTransaction";
import { fetchCategories } from "@/lib/api/client";
import { printTransactionDocument } from "@/lib/hardware/printTransactionDocument";
import type { Category } from "@/types";

interface AddExpensePageClientProps {
  categories: Category[];
}

export function AddExpensePageClient({ categories }: AddExpensePageClientProps) {
  const router = useRouter();
  // ค่าเริ่มต้นจาก server (แสดงทันที) แล้วดึงสดทับเสมอ — หมวดที่เพิ่มใหม่ขึ้นโดยไม่ต้อง login ใหม่
  const [items, setItems] = useState<Category[]>(categories);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      fetchCategories("expense")
        .then((data) => {
          if (alive) setItems(data);
        })
        .catch(() => {});
    };
    refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <AppLayout title="เพิ่มรายจ่าย">
      <div className="pos-page">
        <TransactionForm
          type="expense"
          categories={items}
          onCancel={() => router.back()}
          successRedirect="/expense"
          onSubmit={async (data, { print }) => {
            const transaction = await submitTransaction(data);
            if (print) {
              void printTransactionDocument(transaction, { categories: items }).catch(() => {});
            }
          }}
        />
      </div>
    </AppLayout>
  );
}
