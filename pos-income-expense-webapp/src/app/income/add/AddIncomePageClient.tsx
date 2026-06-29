"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { submitTransaction } from "@/lib/api/submitTransaction";
import { fetchCategories } from "@/lib/api/client";
import { runPostTransactionHardware } from "@/lib/hardware/postTransactionHardware";
import type { Category } from "@/types";

interface AddIncomePageClientProps {
  categories: Category[];
}

export function AddIncomePageClient({ categories }: AddIncomePageClientProps) {
  const router = useRouter();
  // ค่าเริ่มต้นจาก server (แสดงทันที) แล้วดึงสดทับเสมอ — หมวดที่เพิ่มใหม่ขึ้นโดยไม่ต้อง login ใหม่
  const [items, setItems] = useState<Category[]>(categories);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      fetchCategories("income")
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
    <AppLayout title="เพิ่มรายรับ">
      <div className="pos-page">
        <TransactionForm
          type="income"
          categories={items}
          onCancel={() => router.back()}
          successRedirect="/income"
          onSubmit={async (data, { print }) => {
            const transaction = await submitTransaction(data);
            await runPostTransactionHardware(transaction, { print });
          }}
        />
      </div>
    </AppLayout>
  );
}
