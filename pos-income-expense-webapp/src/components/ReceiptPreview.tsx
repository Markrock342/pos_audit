import type { Receipt, Transaction } from "@/types";
import { DefaultReceiptTemplate } from "@/receipt-templates/default-receipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ReceiptPreviewProps {
  transaction: Transaction;
  receipt: Receipt;
}

export function ReceiptPreview({ transaction, receipt }: ReceiptPreviewProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ตัวอย่างใบเสร็จ</CardTitle>
        <Button size="sm" variant="outline">
          พิมพ์ใบเสร็จ (Mock)
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border-default bg-surface-inset p-4">
          <DefaultReceiptTemplate transaction={transaction} receipt={receipt} />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          * การพิมพ์จริงจะเชื่อมต่อ Thermal Printer ผ่าน /lib/hardware ในอนาคต
        </p>
      </CardContent>
    </Card>
  );
}
