import type { ReactNode } from "react";
import {
  receiptRuleLine,
  receiptTotalRuleLine,
} from "@/lib/utils/receiptRule";

export {
  RECEIPT_RULE_WIDTH,
  RECEIPT_RULE_CHAR,
  RECEIPT_ITEM_COL,
  receiptRuleLine,
  receiptTotalRuleLine,
  formatReceiptMetaPair,
  formatReceiptItemRow,
  formatReceiptSummaryRow,
  splitReceiptDateTime,
} from "@/lib/utils/receiptRule";

/** ความกว้างใบเสร็จ 80mm — ให้ preview ตรงกับ thermal print */
export const RECEIPT_THERMAL_WIDTH = "302px";

export function ReceiptShell({
  children,
  fullWidth,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "w-full bg-white py-2" : "mx-auto bg-white py-3"}>
      <div
        className="receipt-thermal mx-auto w-full px-3 py-2 font-sans text-[12px] leading-snug text-black"
        style={{ maxWidth: RECEIPT_THERMAL_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
}

export function ReceiptHeader({
  shopName,
  subtitle,
}: {
  shopName: string;
  subtitle: string;
}) {
  return (
    <div className="text-center text-black">
      <p className="text-[16px] font-bold leading-tight">{shopName}</p>
      <p className="mt-0.5 text-[11px] font-semibold">{subtitle}</p>
      <ReceiptDivider />
    </div>
  );
}

/** เส้นคั่นเต็มความกว้าง — solid แบบ thermal */
export function ReceiptDivider({ total }: { total?: boolean }) {
  return (
    <hr
      className={`receipt-thermal-hr w-full ${total ? "receipt-thermal-hr--total my-2" : "my-1.5"}`}
      aria-hidden
    />
  );
}

/** เส้นคั่นสำหรับพิมพ์ thermal (ตัวอักษร) */
export function ReceiptDividerPrint({ total }: { total?: boolean }) {
  return (
    <div
      className="receipt-thermal-rule my-1.5 w-full overflow-hidden whitespace-nowrap text-black"
      aria-hidden
    >
      {total ? receiptTotalRuleLine() : receiptRuleLine()}
    </div>
  );
}

export function ReceiptMetaPair({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[12px] leading-snug text-black">
      <span className="min-w-0 flex-1">{left}</span>
      <span className="shrink-0 max-w-[48%] text-right tabular-nums">{right}</span>
    </div>
  );
}

export function ReceiptMetaSingle({ text }: { text: string }) {
  return <p className="text-[12px] leading-snug text-black">{text}</p>;
}

export function ReceiptItemTableHeader() {
  return (
    <table className="receipt-thermal-table w-full table-fixed border-collapse text-[11px] font-bold text-black">
      <colgroup>
        <col className="w-[52%]" />
        <col className="w-[16%]" />
        <col className="w-[32%]" />
      </colgroup>
      <thead>
        <tr>
          <th className="pb-0.5 text-left font-bold">รายการ</th>
          <th className="pb-0.5 text-center font-bold">จำนวน</th>
          <th className="pb-0.5 text-right font-bold">รวม</th>
        </tr>
      </thead>
    </table>
  );
}

export function ReceiptItemTableRow({
  title,
  qty,
  amount,
  hint,
}: {
  title: string;
  qty: string | number;
  amount: string;
  hint?: string;
}) {
  return (
    <div className="py-0.5 text-black">
      <table className="receipt-thermal-table w-full table-fixed border-collapse text-[12px]">
        <colgroup>
          <col className="w-[52%]" />
          <col className="w-[16%]" />
          <col className="w-[32%]" />
        </colgroup>
        <tbody>
          <tr className="align-top">
            <td className="pr-1 leading-snug">{title}</td>
            <td className="whitespace-nowrap px-0.5 text-center tabular-nums">{qty}</td>
            <td className="whitespace-nowrap pl-1 text-right tabular-nums">{amount}</td>
          </tr>
        </tbody>
      </table>
      {hint && <p className="mt-0.5 text-[10px] text-black/80">{hint}</p>}
    </div>
  );
}

export function ReceiptSummaryRow({
  label,
  value,
  bold,
  large,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 text-black ${
        large ? "text-[14px] font-bold" : bold ? "text-[12px] font-bold" : "text-[12px]"
      }`}
    >
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

export function ReceiptFooter({ text }: { text: string }) {
  return (
    <div className="text-black">
      <ReceiptDivider />
      <p className="pt-1 text-center text-[11px] leading-snug font-medium">{text}</p>
    </div>
  );
}
