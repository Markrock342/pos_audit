"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, TransactionType } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validations/transaction";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface TransactionFormProps {
  type: TransactionType;
  categories: Category[];
  onSubmit?: (data: TransactionFormValues) => void;
}

export function TransactionForm({ type, categories, onSubmit }: TransactionFormProps) {
  const filteredCategories = categories.filter((c) => c.type === type);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type,
      categoryId: "",
      title: "",
      note: "",
      paymentMethod: "cash",
    },
  });

  const handleFormSubmit = (data: TransactionFormValues) => {
    onSubmit?.(data);
    alert("บันทึกข้อมูล (Mock) — จะเชื่อม API จริงในขั้นตอนถัดไป");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "income" ? "ฟอร์มบันทึกรายรับ" : "ฟอร์มบันทึกรายจ่าย"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...register("type")} />

          <Select
            label="หมวดหมู่"
            placeholder="เลือกหมวดหมู่"
            options={filteredCategories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            error={errors.categoryId?.message}
            {...register("categoryId")}
          />

          <Input
            label="รายการ"
            placeholder="เช่น ลาเต้ร้อน, ซื้อนมสด"
            error={errors.title?.message}
            {...register("title")}
          />

          <Input
            label="จำนวนเงิน (บาท)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount", { valueAsNumber: true })}
          />

          <Select
            label="ช่องทางชำระเงิน"
            options={PAYMENT_METHODS.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            error={errors.paymentMethod?.message}
            {...register("paymentMethod")}
          />

          <Input
            label="หมายเหตุ (ถ้ามี)"
            placeholder="รายละเอียดเพิ่มเติม"
            error={errors.note?.message}
            {...register("note")}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            <Button type="button" variant="outline">
              ยกเลิก
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
