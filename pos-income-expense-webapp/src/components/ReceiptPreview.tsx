"use client";

import { useRef } from "react";
import type { Receipt, Transaction } from "@/types";
import { DefaultReceiptTemplate } from "@/receipt-templates/default-receipt";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";

interface ReceiptPreviewProps {
  transaction: Transaction;
  receipt: Receipt;
}

export function ReceiptPreview({ transaction, receipt }: ReceiptPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { organization } = useOrganization();
  const shopName = organization?.name;
  const receiptFooter = organization?.receiptConfig?.footer;

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>ใบเสร็จ</title>
      <style>body{margin:0;padding:16px;font-family:monospace;font-size:12px;}</style>
      </head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ใบเสร็จ</CardTitle>
        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
          <Printer size={16} />
          พิมพ์ (เครื่องนี้)
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={printRef} className="rounded-lg border border-border-default bg-surface-inset p-4">
          <DefaultReceiptTemplate
            transaction={transaction}
            receipt={receipt}
            shopName={shopName}
            footer={receiptFooter}
          />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          พิมพ์ผ่านเครื่องพิมพ์ทั่วไปของ tablet/PC — เครื่อง thermal จะเพิ่มในเฟสถัดไป
        </p>
      </CardContent>
    </Card>
  );
}
