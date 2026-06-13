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
import { TransactionCartList } from "@/components/forms/TransactionCartList";
import {
  TransactionAmountPanel,
  TransactionCategoryPanel,
  useTransactionLineDraft,
} from "@/components/forms/TransactionLineBuilder";
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
  const saveModeRef = useRef<"redirect" | "new">("redirect");
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
    reset,
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

  const lineDraft = useTransactionLineDraft(filteredCategories, setDraftLine);

  const handleAddLine = (item: LineItemFormValues) => {
    setCartLines((prev) => [...prev, { ...item, localId: newLocalId() }]);
  };

  const handleRemoveLine = (localId: string) => {
    setCartLines((prev) => prev.filter((l) => l.localId !== localId));
  };

  const clearEntry = () => {
    setCartLines([]);
    lineDraft.resetDraft();
    reset({
      type,
      title: "",
      note: "",
      paymentMethod: "cash",
      transactionDate: new Date().toISOString().slice(0, 10),
    });
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

    const mode = saveModeRef.current;
    saveModeRef.current = "redirect";

    if (mode === "redirect" && successRedirect) {
      router.replace(successRedirect);
      return;
    }

    savingRef.current = false;
    setIsSaving(false);
    setToast({ type: "success", message: "บันทึกข้อมูลสำเร็จ" });
    clearEntry();
  };

  const busy = isSubmitting || isSaving;
  const accentBorder = type === "income" ? "border-t-income" : "border-t-expense";

  return (
    <Card className={`pos-page pos-txn-page pb-24 lg:pb-0 border-t-4 ${accentBorder}`}>
      <CardHeader className="pos-page-header shrink-0 border-b border-border-default/50 py-2">
        <CardTitle className="flex items-center gap-2 text-lg font-black">
          {type === "income" ? (
            <ArrowUpCircle size={22} className="text-income" />
          ) : (
            <ArrowDownCircle size={22} className="text-expense" />
          )}
          {type === "income" ? "บันทึกรายรับ" : "บันทึกรายจ่าย"}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 pt-2 lg:p-3">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <input type="hidden" {...register("type")} />

          <div className="pos-txn-terminal min-h-0 flex-1">
            {/* LEFT ~22% — compact receipt preview */}
            <aside className="pos-txn-slip-col min-h-0">
              <DraftBillPreview
                compact
                hideActions
                type={type}
                lines={cartLines}
                draftLine={draftLine}
                categories={filteredCategories}
                billTitle={billTitle}
                paymentMethod={selectedPaymentMethod}
                transactionDate={transactionDate}
                note={billNote}
                onRemove={handleRemoveLine}
              />
            </aside>

            {/* CENTER ~48% — category + bill details */}
            <section className="pos-txn-detail-col pos-scroll min-h-0 rounded-xl border-2 border-border-default bg-surface-elevated p-3">
              <TransactionCategoryPanel
                categories={filteredCategories}
                categoryId={lineDraft.categoryId}
                onSelect={(id) => {
                  lineDraft.setCategoryId(id);
                  lineDraft.setError(null);
                }}
              />

              <div className="pos-txn-bill mt-4 border-t border-border-default pt-4">
                <h3 className="pos-panel-title mb-3 text-sm font-black uppercase tracking-wide text-text-secondary">
                  2. ข้อมูลบิล
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-text-secondary">
                      ชื่อบิล / ผู้ขาย (ไม่บังคับ)
                    </label>
                    <input
                      {...register("title")}
                      placeholder="ว่างไว้ได้"
                      className="pos-bill-input min-h-14 w-full rounded-xl border-2 border-border-default bg-surface-inset px-3 text-base"
                    />
                  </div>

                  <div className="pos-bill-meta-row grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-text-secondary">
                        วันที่
                      </label>
                      <input
                        type="date"
                        {...register("transactionDate")}
                        className="pos-bill-input min-h-14 w-full rounded-xl border-2 border-border-default bg-surface-inset px-3 text-base"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-text-secondary">
                        หมายเหตุ
                      </label>
                      <input
                        {...register("note")}
                        placeholder="ถ้ามี"
                        className="pos-bill-input min-h-14 w-full rounded-xl border-2 border-border-default bg-surface-inset px-3 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                      ช่องทางชำระ
                    </label>
                    <div className="pos-bill-payment-btns grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setValue("paymentMethod", method.value as PaymentMethod)}
                          className={`pos-touch-btn min-h-14 rounded-xl border-2 px-2 text-sm font-bold transition-all active:scale-[0.98] ${
                            selectedPaymentMethod === method.value
                              ? "border-brand bg-brand text-text-inverse shadow-md"
                              : "border-border-default bg-surface-inset text-text-secondary"
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <TransactionCartList lines={cartLines} onRemove={handleRemoveLine} />
            </section>

            {/* RIGHT ~30% — amount + keypad + save */}
            <section className="pos-txn-amount-col flex min-h-0 flex-col rounded-xl border-2 border-border-default bg-surface-elevated p-3">
              <TransactionAmountPanel
                type={type}
                amountString={lineDraft.amountString}
                quantity={lineDraft.quantity}
                customTitle={lineDraft.customTitle}
                showTitle={lineDraft.showTitle}
                error={lineDraft.error}
                onAmountChange={(v) => {
                  lineDraft.setAmountString(v);
                  lineDraft.setError(null);
                }}
                onQuantityChange={(fn) => lineDraft.setQuantity(fn)}
                onCustomTitleChange={lineDraft.setCustomTitle}
                onShowTitle={() => lineDraft.setShowTitle(true)}
                onAdd={() => lineDraft.handleAdd(handleAddLine)}
              />

              <div className="pos-txn-actions mt-auto shrink-0 space-y-2 border-t border-border-default pt-3">
                <Button
                  type="submit"
                  disabled={busy || cartLines.length === 0}
                  variant={type === "income" ? "income" : "danger"}
                  size="lg"
                  className="w-full text-lg font-black"
                  onClick={() => {
                    saveModeRef.current = successRedirect ? "redirect" : "new";
                  }}
                >
                  {busy ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <div className={`grid gap-2 ${onCancel ? "grid-cols-2" : "grid-cols-1"}`}>
                  <Button
                    type="submit"
                    disabled={busy || cartLines.length === 0}
                    variant="secondary"
                    size="md"
                    className="w-full font-bold"
                    onClick={() => {
                      saveModeRef.current = "new";
                    }}
                  >
                    บันทึก &amp; ใหม่
                  </Button>
                  {onCancel && (
                    <Button type="button" variant="outline" size="md" className="w-full font-bold" onClick={onCancel}>
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="pos-kiosk-hide-mobile-save tablet-sticky-action lg:hidden">
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
