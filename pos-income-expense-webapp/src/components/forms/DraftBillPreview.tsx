"use client";

import { useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { Category, PaymentMethod, TransactionType } from "@/types";
import { DefaultExpenseVoucherTemplate } from "@/receipt-templates/default-expense-voucher";
import { DefaultReceiptTemplate } from "@/receipt-templates/default-receipt";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import { SHOP_NAME } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  compact?: boolean;
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
  compact,
}: {
  type: TransactionType;
  shopName: string;
  compact?: boolean;
}) {
  return (
<<<<<<< HEAD
    <div className="mx-auto w-full max-w-[80mm] bg-white p-4 font-sans text-[12px] leading-snug text-black">
=======
    <div
      className={`mx-auto w-full bg-white font-sans leading-snug text-black ${
        compact ? "max-w-full p-2 text-[10px]" : "max-w-[302px] p-4 text-[12px]"
      }`}
    >
>>>>>>> f4039aa (feat(webapp): optimize POS terminal layout for iMin Swan 2 touch workflow)
      <div className="text-center">
        <p className={`font-bold ${compact ? "text-[11px]" : "text-[16px]"}`}>{shopName}</p>
        <p className={`mt-0.5 font-semibold ${compact ? "text-[9px]" : "text-[11px]"}`}>
          {type === "income" ? "ใบเสร็จรับเงิน / Receipt" : "ใบบันทึกรายจ่าย"}
        </p>
      </div>
      <hr className="receipt-thermal-hr my-2 w-full" aria-hidden />
      <p
        className={`text-center leading-relaxed text-black/70 ${
          compact ? "py-4 text-[10px]" : "py-10 text-[12px]"
        }`}
      >
        เลือกหมวด + ใส่ราคา
        <br />
        ใบเสร็จจะอัปเดตอัตโนมัติ
      </p>
      <hr className="receipt-thermal-hr w-full" aria-hidden />
      {!compact && (
        <p className="pt-2 text-center text-[11px] text-black/70">— ตัวอย่าง —</p>
      )}
    </div>
  );
}

function ReceiptBody({
  type,
  draftTransaction,
  shopName,
  receiptFooter,
  sessionName,
  categoryNames,
}: {
  type: TransactionType;
  draftTransaction: ReturnType<typeof buildDraftTransaction>;
  shopName: string;
  receiptFooter?: string;
  sessionName?: string;
  categoryNames: Record<string, string>;
}) {
  if (!draftTransaction) return null;

  if (type === "income") {
    return (
      <DefaultReceiptTemplate
        transaction={draftTransaction}
        receipt={{ id: "draft", transactionId: "draft", receiptNumber: "ร่าง" }}
        shopName={shopName}
        footer={receiptFooter}
        sellerName={sessionName}
        fullWidth
      />
    );
  }

  return (
    <DefaultExpenseVoucherTemplate
      transaction={draftTransaction}
      voucherNumber="ร่าง"
      shopName={shopName}
      recorderName={sessionName}
      categoryNames={categoryNames}
      fullWidth
    />
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
  compact = false,
}: DraftBillPreviewProps) {
  const [expanded, setExpanded] = useState(false);
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

  const titleLabel = type === "income" ? "ใบเสร็จ" : "ใบจ่าย";
  const totalLabel = draftTransaction ? formatCurrency(draftTransaction.amount) : "—";

  return (
    <>
      <Card className="pos-slip-card flex h-full min-h-0 flex-col overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.12)]">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-1 border-b border-border-default/60 px-2.5 py-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-xs font-black">{titleLabel}</CardTitle>
            <p className="truncate text-[11px] font-bold tabular-nums text-brand">{totalLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {draftTransaction && (
              <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                ร่าง
              </span>
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="pos-touch-btn flex min-h-10 min-w-10 items-center justify-center rounded-lg text-text-muted active:bg-surface-hover"
              aria-label="ขยายตัวอย่างใบเสร็จ"
              title="ขยาย"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden p-1.5">
          <div className="pos-slip-preview flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default bg-[#f4f4f5] p-1">
            <div className="flex min-h-0 flex-1 justify-center overflow-y-auto rounded-md bg-white shadow-inner">
              {draftTransaction ? (
                <ReceiptBody
                  type={type}
                  draftTransaction={draftTransaction}
                  shopName={shopName}
                  receiptFooter={receiptFooter}
                  sessionName={sessionName}
                  categoryNames={categoryNames}
                />
              ) : (
                <EmptyDraftSlip type={type} shopName={shopName} compact={compact} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setExpanded(false)} aria-hidden />
          <div
            role="dialog"
            aria-labelledby="slip-expand-title"
            className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-border-default bg-surface-elevated shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border-default px-4 py-3">
              <h2 id="slip-expand-title" className="text-base font-black">
                {type === "income" ? "ใบเสร็จ (ตัวอย่าง)" : "ใบบันทึกรายจ่าย (ตัวอย่าง)"}
              </h2>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-xl p-2 text-text-muted hover:bg-surface-hover"
                aria-label="ปิด"
              >
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto bg-[#ececec] p-4">
              <div className="mx-auto max-w-[302px] rounded-lg bg-white shadow-lg">
                {draftTransaction ? (
                  <ReceiptBody
                    type={type}
                    draftTransaction={draftTransaction}
                    shopName={shopName}
                    receiptFooter={receiptFooter}
                    sessionName={sessionName}
                    categoryNames={categoryNames}
                  />
                ) : (
                  <EmptyDraftSlip type={type} shopName={shopName} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
