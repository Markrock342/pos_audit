"use client";

import { useRef, useState } from "react";
import type { Receipt, Transaction } from "@/types";
import { DefaultReceiptTemplate } from "@/receipt-templates/default-receipt";
import { RECEIPT_BROWSER_PRINT_CSS } from "@/receipt-templates/shared";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { shouldOpenCashDrawer } from "@/lib/hardware/cashDrawerPolicy";
import { isEditedTransaction } from "@/lib/utils/receiptFormat";
import { printReceipt } from "@/lib/hardware/printer";

interface ReceiptPreviewProps {
  transaction: Transaction;
  receipt: Receipt;
  /** ขยายเต็มความสูงของ panel */
  fill?: boolean;
  /** แสดงใน sidebar แคบ — ใบเสร็จเต็มความกว้าง */
  compact?: boolean;
}

function readSellerName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return undefined;
    return (JSON.parse(raw) as KioskSession).displayName;
  } catch {
    return undefined;
  }
}

export function ReceiptPreview({ transaction, receipt, fill, compact }: ReceiptPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const [printMessage, setPrintMessage] = useState<string | null>(null);
  const { organization } = useOrganization();
  const shopName = organization?.receiptConfig?.header ?? organization?.name;
  const receiptFooter = organization?.receiptConfig?.footer;
  const sellerName = readSellerName();

  const printViaBrowser = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>ใบเสร็จ</title>
      <style>${RECEIPT_BROWSER_PRINT_CSS}</style>
      </head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handlePrint = async () => {
    setPrinting(true);
    setPrintMessage(null);
    const isRevision = isEditedTransaction(transaction);
    try {
      const result = await printReceipt(transaction, receipt, {
        openDrawer: !isRevision && shouldOpenCashDrawer(transaction),
        shopName,
        footer: receiptFooter,
        sellerName,
        address: organization?.address,
        phone: organization?.phone,
        taxId: organization?.taxId,
        isRevision,
        revisedAt: transaction.updatedAt,
      });

      if (result.success) {
        setPrintMessage(result.message);
        return;
      }

      if (result.fallback === "browser") {
        printViaBrowser();
        setPrintMessage("พิมพ์ผ่านเบราว์เซอร์ (ยังไม่ได้ตั้งค่าเครื่องพิมพ์ thermal)");
        return;
      }

      setPrintMessage(result.message);
    } finally {
      setPrinting(false);
    }
  };

  const lineCount = transaction.lineItems?.length ?? 1;
  const isRevision = isEditedTransaction(transaction);

  return (
    <Card className={cn("flex flex-col", fill && "h-full min-h-[280px] xl:min-h-0")}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border-default/60 py-3">
        <div className="min-w-0">
          <CardTitle className={cn(compact && "text-base")}>
            {isRevision ? "ใบเสร็จ (ฉบับแก้ไข)" : "ใบเสร็จ"}
          </CardTitle>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {transaction.title} · {lineCount} รายการ · {formatCurrency(transaction.amount)}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handlePrint()}
          disabled={printing}
          className="gap-1.5 shrink-0 px-2.5"
        >
          <Printer size={15} />
          {printing ? "กำลังพิมพ์..." : "พิมพ์"}
        </Button>
      </CardHeader>
      <CardContent
        className={cn(
          "flex flex-1 flex-col",
          compact ? "min-h-0 overflow-hidden p-2" : "p-4",
          fill && !compact && "min-h-0 overflow-hidden"
        )}
      >
        <div
          className={cn(
            "flex flex-1 rounded-xl border border-border-default bg-[#f4f4f5]",
            compact ? "min-h-0 overflow-y-auto p-2" : "items-start justify-center p-4",
            fill && !compact && "min-h-0 overflow-y-auto"
          )}
        >
          <div
            ref={printRef}
            className={cn(
              "rounded-lg bg-white shadow-lg",
              compact || fill ? "w-full" : ""
            )}
          >
            <DefaultReceiptTemplate
              transaction={transaction}
              receipt={receipt}
              shopName={shopName}
              footer={receiptFooter}
              sellerName={sellerName}
              address={organization?.address}
              phone={organization?.phone}
              taxId={organization?.taxId}
              fullWidth={compact || fill}
              isRevision={isRevision}
              revisedAt={transaction.updatedAt}
            />
          </div>
        </div>
        {!compact && !fill && (
          <p className="mt-3 shrink-0 text-xs text-text-muted">
            {printMessage ?? "วันที่บนใบเสร็จ = เวลาที่บันทึกจริง · บน iMin กดพิมพ์ได้ทันที (ไม่ต้องใส่ IP)"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
