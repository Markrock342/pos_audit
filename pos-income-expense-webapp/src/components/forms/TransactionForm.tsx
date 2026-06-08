"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, TransactionType } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validations/transaction";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface TransactionFormProps {
  type: TransactionType;
  categories: Category[];
  onSubmit?: (data: TransactionFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

export function TransactionForm({ type, categories, onSubmit, onCancel }: TransactionFormProps) {
  const filteredCategories = categories.filter((c) => c.type === type);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type,
      categoryId: "",
      title: "",
      note: "",
      paymentMethod: "cash",
      amount: 0,
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  });

  const [amountString, setAmountString] = useState("0");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const amount = watch("amount") || 0;

  const formatDisplay = (val: string) => {
    if (val === "0" || val === "") return "0";
    const parts = val.split(".");
    const intPart = parts[0];
    const decPart = parts[1] ?? "";
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart !== "" ? `${formattedInt}.${decPart}` : formattedInt;
  };

  const selectedCategoryId = watch("categoryId");
  const selectedPaymentMethod = watch("paymentMethod");

  const handleNumpadClick = (value: string) => {
    let newAmount: string;

    if (value === "C") {
      newAmount = "0";
    } else if (value === "⌫") {
      newAmount = amountString.slice(0, -1) || "0";
    } else if (value === ".") {
      newAmount = amountString.includes(".") ? amountString : amountString + ".";
    } else {
      newAmount = amountString === "0" ? value : amountString + value;
    }

    setAmountString(newAmount);
    setValue("amount", parseFloat(newAmount) || 0);
  };

  const handleFormSubmit = async (data: TransactionFormValues) => {
    if (!data.categoryId) {
      setToast({ type: "error", message: "กรุณาเลือกหมวดหมู่" });
      return;
    }
    if (!data.title || data.title.trim() === "") {
      setToast({ type: "error", message: "กรุณากรอกรายการ" });
      return;
    }
    if (!data.amount || data.amount <= 0) {
      setToast({ type: "error", message: "กรุณากรอกจำนวนเงิน" });
      return;
    }

    try {
      await onSubmit?.(data);
      setToast({ type: "success", message: "บันทึกข้อมูลสำเร็จ" });
    } catch {
      setToast({ type: "error", message: "บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง" });
    }
  };

  return (
    <Card className={type === "income" ? "border-t-4 border-t-income" : "border-t-4 border-t-expense"}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-black flex items-center gap-3">
          {type === "income" ? (
            <ArrowUpCircle size={28} className="text-income" />
          ) : (
            <ArrowDownCircle size={28} className="text-expense" />
          )}
          {type === "income" ? "บันทึกรายรับ" : "บันทึกรายจ่าย"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-6">
          <input type="hidden" {...register("type")} />

          {/* Category Grid */}
          <div>
            <label className="mb-3 block text-lg font-semibold text-text-secondary">
              หมวดหมู่ <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setValue("categoryId", category.id)}
                  className={`min-h-[80px] rounded-2xl border-2 p-4 text-center text-lg font-bold shadow-sm text-text-main ${
                    selectedCategoryId === category.id
                      ? "scale-105 shadow-lg"
                      : "active:bg-surface-hover"
                  } ${errors.categoryId && !selectedCategoryId ? "border-error bg-error-light" : "border-border-default bg-surface-elevated"}`}
                  style={
                    selectedCategoryId === category.id
                      ? {
                          borderColor: category.color,
                          backgroundColor: `${category.color}15`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="mb-2 h-4 w-4 rounded-full mx-auto shadow-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </button>
              ))}
            </div>
            {errors.categoryId && (
              <p className="mt-2 text-sm text-error font-medium">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="mb-2 block text-lg font-semibold text-text-secondary">
              รายการ <span className="text-error">*</span>
            </label>
            <input
              {...register("title")}
              placeholder="เช่น ลาเต้ร้อน, ซื้อนมสด"
              className={`w-full rounded-2xl border-2 bg-surface-elevated px-4 py-4 text-lg text-text-main placeholder:text-text-muted focus:outline-none focus:ring-4 shadow-sm transition-all ${
                errors.title
                  ? "border-error focus:border-error focus:ring-error-ring"
                  : "border-border-default focus:border-border-focus focus:ring-brand-ring"
              }`}
            />
            {errors.title && (
              <p className="mt-2 text-sm text-error font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Date Input */}
          <div>
            <label className="mb-2 block text-lg font-semibold text-text-secondary">
              วันที่
            </label>
            <input
              type="date"
              {...register("transactionDate")}
              className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated px-4 py-4 text-lg text-text-main focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring shadow-sm min-h-[64px]"
            />
          </div>

          {/* Amount Display & Numpad */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-lg font-semibold text-text-secondary">
                จำนวนเงิน (บาท) <span className="text-error">*</span>
              </label>
              <div className={`flex items-center rounded-2xl border-2 px-6 py-5 shadow-md ${
                errors.amount
                  ? "border-error bg-error-light"
                  : "border-border-default bg-surface-elevated"
              }`}>
                <span className={`text-4xl font-bold ${errors.amount ? "text-error" : "text-text-muted"}`}>฿</span>
                <span className={`ml-3 text-5xl font-bold ${errors.amount ? "text-error" : "text-text-main"}`}>
                  {formatDisplay(amountString)}
                </span>
              </div>
              {errors.amount && (
                <p className="mt-2 text-sm text-error font-medium">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "."].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNumpadClick(key)}
                  className={`min-h-[88px] rounded-2xl text-3xl font-bold shadow-md active:shadow-lg active:scale-95 text-text-main ${
                    key === "C"
                      ? "bg-expense-light text-expense active:bg-expense/20"
                      : "bg-surface-hover active:bg-border-default"
                  }`}
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNumpadClick("⌫")}
                className="min-h-[88px] rounded-2xl bg-surface-hover text-3xl font-bold text-text-secondary active:bg-border-default shadow-md active:shadow-lg active:scale-95"
              >
                ⌫
              </button>
              <button
                type="button"
                onClick={() => handleNumpadClick("00")}
                className="min-h-[88px] rounded-2xl bg-surface-hover text-3xl font-bold text-text-main active:bg-border-default shadow-md active:shadow-lg active:scale-95"
              >
                00
              </button>
            </div>
          </div>

          {/* Payment Method Grid */}
          <div>
            <label className="mb-3 block text-lg font-semibold text-text-secondary">
              ช่องทางชำระเงิน
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setValue("paymentMethod", method.value as any)}
                  className={`min-h-[80px] rounded-2xl border-2 p-4 text-center text-lg font-bold shadow-sm ${
                    selectedPaymentMethod === method.value
                      ? "scale-105 shadow-lg border-text-main bg-text-main text-text-inverse"
                      : "border-border-default bg-surface-elevated text-text-secondary active:bg-surface-hover active:border-text-muted"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {errors.paymentMethod && (
              <p className="mt-2 text-sm text-error font-medium">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="mb-2 block text-lg font-semibold text-text-secondary">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              {...register("note")}
              placeholder="รายละเอียดเพิ่มเติม"
              rows={2}
              className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated px-4 py-3 text-base text-text-main placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring shadow-sm transition-all resize-none"
            />
            {errors.note && (
              <p className="mt-2 text-sm text-error font-medium">{errors.note.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="flex-1 text-xl font-bold shadow-lg active:shadow-xl"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                size="lg"
                className="flex-1 text-xl font-bold shadow-md active:shadow-lg"
              >
                ยกเลิก
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </Card>
  );
}
