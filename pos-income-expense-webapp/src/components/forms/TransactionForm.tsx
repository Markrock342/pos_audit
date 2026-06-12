"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { Category, TransactionType } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import {
  transactionSchema,
  type LineItemFormValues,
  type TransactionFormValues,
} from "@/lib/validations/transaction";
import { type CartLine } from "@/components/forms/TransactionCartPanel";
import { DraftBillPreview } from "@/components/forms/DraftBillPreview";
import { FloatingSlipFollow } from "@/components/forms/FloatingSlipFollow";
import { TransactionLineBuilder } from "@/components/forms/TransactionLineBuilder";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import type { PaymentMethod } from "@/types";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface TransactionFormProps {
  type: TransactionType;
  categories: Category[];
  onSubmit?: (data: TransactionFormValues) => void | Promise<void>;
  onCancel?: () => void;
  successRedirect?: string;
}

function newLocalId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TransactionForm({
  type,
  categories,
  onSubmit,
  onCancel,
  successRedirect,
}: TransactionFormProps) {
  const router = useRouter();
  const savingRef = useRef(false);
  const filteredCategories = categories.filter((c) => c.type === type);

  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [draftLine, setDraftLine] = useState<LineItemFormValues | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<Omit<TransactionFormValues, "lineItems">>({
    defaultValues: {
      type,
      title: "",
      note: "",
      paymentMethod: "cash",
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const billTitle = watch("title");
  const transactionDate = watch("transactionDate");
  const billNote = watch("note");
  const dismissToast = useCallback(() => setToast(null), []);

  const handleAddLine = (item: LineItemFormValues) => {
    setCartLines((prev) => [...prev, { ...item, localId: newLocalId() }]);
  };

  const handleRemoveLine = (localId: string) => {
    setCartLines((prev) => prev.filter((l) => l.localId !== localId));
  };

  const handleFormSubmit = async (header: Omit<TransactionFormValues, "lineItems">) => {
    if (savingRef.current) return;

    if (cartLines.length === 0) {
      setToast({ type: "error", message: "กรุณาเพิ่มอย่างน้อย 1 รายการ" });
      return;
    }

    const data: TransactionFormValues = {
      ...header,
      type,
      lineItems: cartLines.map(({ localId: _id, ...item }, index) => ({
        ...item,
        sortOrder: index,
      })),
    };

    const parsed = transactionSchema.safeParse(data);
    if (!parsed.success) {
      setToast({ type: "error", message: "กรุณาตรวจสอบข้อมูลให้ครบ" });
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setToast(null);

    try {
      await onSubmit?.(parsed.data);
    } catch {
      savingRef.current = false;
      setIsSaving(false);
      setToast({ type: "error", message: "บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง" });
      return;
    }

    if (successRedirect) {
      router.replace(successRedirect);
      return;
    }

    savingRef.current = false;
    setIsSaving(false);
    setToast({ type: "success", message: "บันทึกข้อมูลสำเร็จ" });
    setCartLines([]);
  };

  const busy = isSubmitting || isSaving;

  return (
    <Card className={`pb-24 lg:pb-0 ${type === "income" ? "border-t-4 border-t-income" : "border-t-4 border-t-expense"}`}>
      <CardHeader className="pb-2 2xl:pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-black 2xl:gap-3 2xl:text-2xl">
          {type === "income" ? (
            <ArrowUpCircle size={24} className="text-income 2xl:h-7 2xl:w-7" />
          ) : (
            <ArrowDownCircle size={24} className="text-expense 2xl:h-7 2xl:w-7" />
          )}
          {type === "income" ? "บันทึกรายรับ" : "บันทึกรายจ่าย"}
        </CardTitle>
        <p className="mt-1 text-sm text-text-muted">
          แตะเลือกหมวด → ใส่ราคา → กดเพิ่มรายการ (ทำซ้ำได้หลายรายการ)
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <input type="hidden" {...register("type")} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] 2xl:gap-6">
            <FloatingSlipFollow>
              <DraftBillPreview
                type={type}
                lines={cartLines}
                draftLine={draftLine}
                categories={filteredCategories}
                billTitle={billTitle}
                paymentMethod={selectedPaymentMethod}
                transactionDate={transactionDate}
                note={billNote}
                onRemove={handleRemoveLine}
                isSaving={isSaving}
                isSubmitting={isSubmitting}
                onCancel={onCancel}
              />
            </FloatingSlipFollow>

            <div className="flex min-w-0 flex-col gap-5">
              <section className="rounded-xl border-2 border-border-default bg-surface-elevated p-3 2xl:rounded-2xl 2xl:p-4">
                <TransactionLineBuilder
                  categories={filteredCategories}
                  type={type}
                  onAdd={handleAddLine}
                  onDraftChange={setDraftLine}
                />
              </section>

              <section className="space-y-3 rounded-xl border-2 border-border-default bg-surface-elevated p-3 2xl:space-y-4 2xl:rounded-2xl 2xl:p-4">
                <h3 className="text-base font-bold text-text-main">ข้อมูลบิล</h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-text-secondary">
                      ชื่อบิล (ไม่บังคับ)
                    </label>
                    <input
                      {...register("title")}
                      placeholder="เช่น ขายให้คุณสมชาย — ว่างไว้ได้"
                      className="w-full rounded-xl border-2 border-border-default bg-surface-inset px-4 py-3 text-base min-h-[52px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-text-secondary">
                      วันที่
                    </label>
                    <input
                      type="date"
                      {...register("transactionDate")}
                      className="w-full rounded-xl border-2 border-border-default bg-surface-inset px-4 py-3 min-h-[52px] text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-secondary">
                    ช่องทางชำระ
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setValue("paymentMethod", method.value as PaymentMethod)}
                        className={`min-h-[48px] rounded-xl border-2 px-2 py-2 text-sm font-bold transition-all active:scale-[0.98] 2xl:min-h-[56px] 2xl:px-3 ${
                          selectedPaymentMethod === method.value
                            ? "border-text-main bg-text-main text-text-inverse shadow-md"
                            : "border-border-default bg-surface-inset text-text-secondary"
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-secondary">
                    หมายเหตุ (ไม่บังคับ)
                  </label>
                  <input
                    {...register("note")}
                    placeholder="ถ้ามี"
                    className="w-full rounded-xl border-2 border-border-default bg-surface-inset px-4 py-3 min-h-[52px]"
                  />
                </div>
              </section>
            </div>
          </div>

          <div className="tablet-sticky-action lg:hidden">
            <Button
              type="submit"
              disabled={busy || cartLines.length === 0}
              variant={type === "income" ? "income" : "danger"}
              size="lg"
              className="flex-1 text-xl font-bold"
            >
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} size="lg" className="flex-1">
                ยกเลิก
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      {toast && <Toast type={toast.type} message={toast.message} onClose={dismissToast} />}
    </Card>
  );
}
