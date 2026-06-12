"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { Category, PaymentMethod, TransactionType } from "@/types";
import { DefaultExpenseVoucherTemplate } from "@/receipt-templates/default-expense-voucher";
import { DefaultReceiptTemplate } from "@/receipt-templates/default-receipt";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import { SHOP_NAME } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import { buildDraftTransaction } from "@/lib/utils/buildDraftTransaction";
import type { LineItemFormValues } from "@/lib/validations/transaction";
import type { CartLine } from "@/components/forms/TransactionCartPanel";
interface DraftBillPreviewProps {
  type: TransactionType;
  lines: CartLine[];
  draftLine?: LineItemFormValues | null;
  categories: Category[];
  billTitle?: string;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  note?: string;
  onRemove: (localId: string) => void;
  isSaving?: boolean;
  isSubmitting?: boolean;
  onCancel?: () => void;
  hideActions?: boolean;
}

function readSessionName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return undefined;
    return (JSON.parse(raw) as KioskSession).displayName;
  } catch {
    return undefined;
  }
}

function EmptyDraftSlip({
  type,
  shopName,
}: {
  type: TransactionType;
  shopName: string;
}) {
  return (
    <div className="mx-auto w-full bg-white p-4 font-mono text-[11px] leading-snug text-black">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide">{shopName}</p>
        <p className="mt-1 text-[10px] text-gray-700">
          {type === "income" ? "ใบเสร็จรับเงิน / Receipt" : "ใบบันทึกรายจ่าย"}
        </p>
      </div>
      <div
        className="my-3 overflow-hidden whitespace-nowrap text-[10px] text-gray-400"
        aria-hidden
      >
        {"-".repeat(42)}
      </div>
      <p className="py-10 text-center text-[11px] leading-relaxed text-gray-500">
        เลือกหมวด + ใส่ราคา
        <br />
        ใบเสร็จจะอัปเดตอัตโนมัติ
      </p>
      <div
        className="overflow-hidden whitespace-nowrap text-[10px] text-gray-400"
        aria-hidden
      >
        {".".repeat(42)}
      </div>
      <p className="pt-2 text-center text-[10px] text-gray-500">— ตัวอย่าง —</p>
    </div>
  );
}

export function DraftBillPreview({
  type,
  lines,
  draftLine,
  categories,
  billTitle,
  paymentMethod,
  transactionDate,
  note,
  onRemove,
  isSaving,
  isSubmitting,
  onCancel,
  hideActions,
}: DraftBillPreviewProps) {
  const { organization } = useOrganization();
  const shopName = organization?.receiptConfig?.header ?? organization?.name ?? SHOP_NAME;
  const receiptFooter = organization?.receiptConfig?.footer;
  const sessionName = readSessionName();

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const draftTransaction = useMemo(
    () =>
      buildDraftTransaction({
        type,
        cartLines: lines,
        draftLine,
        billTitle,
        paymentMethod,
        transactionDate,
        note,
      }),
    [type, lines, draftLine, billTitle, paymentMethod, transactionDate, note]
  );

  const busy = isSaving || isSubmitting;
  const titleLabel = type === "income" ? "ใบเสร็จ (ตัวอย่าง)" : "ใบบันทึกรายจ่าย (ตัวอย่าง)";

  return (
    <div className="flex flex-col gap-2 2xl:gap-3">
      <Card className="flex flex-col">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border-default/60 px-4 py-2 2xl:px-6 2xl:py-3">
          <div className="min-w-0">
            <CardTitle className="text-sm 2xl:text-base">{titleLabel}</CardTitle>
            <p className="mt-0.5 text-xs text-text-muted">
              {draftTransaction
                ? `${draftTransaction.title} · ${formatCurrency(draftTransaction.amount)}`
                : "อัปเดตแบบ realtime ขณะพิมพ์"}
            </p>
          </div>
          {draftTransaction && (
            <span className="shrink-0 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand">
              ร่าง
            </span>
          )}
        </CardHeader>
        <CardContent className="min-h-0 overflow-hidden p-1.5 2xl:p-2">
          <div className="flex min-h-[160px] flex-1 flex-col rounded-lg border border-border-default bg-[#f4f4f5] p-1.5 2xl:min-h-[200px] 2xl:rounded-xl 2xl:p-2">
            <div className="w-full overflow-y-auto rounded-lg bg-white shadow-lg">
              {draftTransaction ? (
                type === "income" ? (
                  <DefaultReceiptTemplate
                    transaction={draftTransaction}
                    receipt={{
                      id: "draft",
                      transactionId: "draft",
                      receiptNumber: "ร่าง",
                    }}
                    shopName={shopName}
                    footer={receiptFooter}
                    sellerName={sessionName}
                    fullWidth
                  />
                ) : (
                  <DefaultExpenseVoucherTemplate
                    transaction={draftTransaction}
                    voucherNumber="ร่าง"
                    shopName={shopName}
                    recorderName={sessionName}
                    categoryNames={categoryNames}
                    fullWidth
                  />
                )
              ) : (
                <EmptyDraftSlip type={type} shopName={shopName} />
              )}
            </div>
          </div>
        </CardContent>

        {!hideActions && (
          <div className="hidden shrink-0 space-y-2 border-t border-border-default/60 p-3 lg:block 2xl:p-4">
            <Button
              type="submit"
              disabled={busy || lines.length === 0}
              size="md"
              variant={type === "income" ? "income" : "danger"}
              className="w-full text-base font-black shadow-lg 2xl:text-xl"
            >
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                size="md"
                className="w-full text-base font-bold 2xl:text-lg"
              >
                ยกเลิก
              </Button>
            )}
          </div>
        )}
      </Card>

      {lines.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-text-muted">รายการที่เพิ่มแล้ว</p>
          <ul className="space-y-2">
            {lines.map((line, index) => (
              <li
                key={line.localId}
                className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-elevated px-3 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-inset text-xs font-black text-text-secondary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-main">{line.title}</p>
                  <p className="text-xs text-text-muted">
                    {line.quantity} × {formatCurrency(line.unitPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line.localId)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted active:bg-expense-light active:text-expense"
                  aria-label="ลบรายการ"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
