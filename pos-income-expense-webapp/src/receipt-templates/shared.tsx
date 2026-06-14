import type { ReactNode } from "react";
import { formatReceiptDateTime } from "@/lib/utils/receiptFormat";
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

/**
 * CSS สำหรับพิมพ์ผ่าน browser — กระดาษ 80mm
 * หน้าต่างพิมพ์มีแค่ CSS นี้ (ไม่มี Tailwind) จึง style ผ่าน semantic class `.rcpt-*`
 * ดีไซน์ = ใบเสร็จ thermal จริง (ขาว-ดำ ตัวหนา/เส้นคั่น) ให้พรีวิวตรงกับงานพิมพ์
 */
export const RECEIPT_BROWSER_PRINT_CSS = `
@page { size: 80mm auto; margin: 0; }
html, body { margin: 0; padding: 0; width: 80mm; max-width: 80mm; background: #fff; }
* , *::before, *::after {
  box-sizing: border-box;
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body {
  font-family: "Noto Sans Thai", system-ui, -apple-system, sans-serif;
  font-size: 12px; line-height: 1.4; color: #000; background: #fff;
  font-weight: 500;
}
.rcpt { width: 80mm; max-width: 80mm; padding: 3mm 3.5mm 4mm; }
.rcpt-center { text-align: center; }
.rcpt-shop { font-size: 19px; font-weight: 800; line-height: 1.15; letter-spacing: -0.01em; margin: 0; }
.rcpt-contact { font-size: 10.5px; font-weight: 500; line-height: 1.35; margin: 0; }
.rcpt-title { margin: 6px 0 0; text-align: center; font-size: 13px; font-weight: 800; letter-spacing: 0.16em; }
.rcpt-title-sub { margin-top: 1px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.32em; display: block; }
.rcpt-meta { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; line-height: 1.5; }
.rcpt-meta > span:first-child { min-width: 0; }
.rcpt-meta > span:last-child { flex-shrink: 0; max-width: 52%; text-align: right; font-variant-numeric: tabular-nums; }
.rcpt-meta-single { font-size: 11px; line-height: 1.5; margin: 0; }
.rcpt-hr { border: 0; border-top: 1px solid #000; margin: 6px 0; }
.rcpt-hr--dashed { border-top: 1px dashed #000; }
.rcpt-hr--total { border-top: 2px solid #000; margin: 5px 0; }
.rcpt-tbl { width: 100%; table-layout: fixed; border-collapse: collapse; }
.rcpt-tbl th, .rcpt-tbl td { padding: 0; color: #000; }
.rcpt-th { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
.rcpt-row { padding: 3px 0; }
.rcpt-row td { font-size: 12px; font-weight: 600; vertical-align: top; line-height: 1.35; }
.rcpt-row .c-qty { text-align: center; font-variant-numeric: tabular-nums; }
.rcpt-row .c-amt { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rcpt-row-hint { font-size: 10px; font-weight: 500; margin: 1px 0 0; }
.rcpt-sum { display: flex; justify-content: space-between; gap: 10px; font-size: 11.5px; line-height: 1.6; }
.rcpt-sum > span:last-child { font-variant-numeric: tabular-nums; white-space: nowrap; }
.rcpt-sum--bold { font-weight: 800; }
.rcpt-total { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.rcpt-total .lbl { font-size: 14px; font-weight: 800; letter-spacing: 0.02em; }
.rcpt-total .val { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rcpt-foot { text-align: center; }
.rcpt-foot-main { font-size: 11.5px; font-weight: 800; line-height: 1.4; margin: 0; }
.rcpt-foot-note { margin: 2px 0 0; font-size: 9px; font-weight: 500; line-height: 1.4; }
`;

/** ความกว้างใบเสร็จ 80mm */
export const RECEIPT_THERMAL_WIDTH = "80mm";

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
        className="rcpt receipt-thermal mx-auto w-full px-[3.5mm] py-[3mm] font-sans text-[12px] font-medium leading-[1.4] text-black"
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
  subtitleEn,
  address,
  phone,
  taxId,
}: {
  shopName: string;
  subtitle: string;
  subtitleEn?: string;
  address?: string;
  phone?: string;
  taxId?: string;
}) {
  const contactLine2 = [phone ? `โทร. ${phone}` : null, taxId ? `เลขภาษี ${taxId}` : null]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="rcpt-center text-center text-black">
      <p className="rcpt-shop text-[19px] font-extrabold leading-[1.15] tracking-tight">
        {shopName}
      </p>
      {address && (
        <p className="rcpt-contact mt-0.5 text-[10.5px] font-medium leading-snug">{address}</p>
      )}
      {contactLine2 && (
        <p className="rcpt-contact text-[10.5px] font-medium leading-snug">{contactLine2}</p>
      )}
      <ReceiptDivider />
      <p className="rcpt-title text-center text-[13px] font-extrabold tracking-[0.16em] text-black">
        {subtitle}
        {subtitleEn && (
          <span className="rcpt-title-sub mt-px block text-[9.5px] font-bold tracking-[0.32em]">
            {subtitleEn}
          </span>
        )}
      </p>
    </div>
  );
}

/** เส้นคั่นเต็มความกว้าง */
export function ReceiptDivider({ total, dashed }: { total?: boolean; dashed?: boolean }) {
  const cls = total
    ? "rcpt-hr rcpt-hr--total my-[5px] border-t-2 border-black"
    : dashed
      ? "rcpt-hr rcpt-hr--dashed my-1.5 border-t border-dashed border-black"
      : "rcpt-hr my-1.5 border-t border-black";
  return <hr className={`w-full ${cls}`} aria-hidden />;
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
    <div className="rcpt-meta flex items-start justify-between gap-2.5 text-[11px] leading-normal text-black">
      <span className="min-w-0 flex-1">{left}</span>
      <span className="max-w-[52%] shrink-0 text-right tabular-nums">{right}</span>
    </div>
  );
}

export function ReceiptMetaSingle({ text }: { text: string }) {
  return <p className="rcpt-meta-single text-[11px] leading-normal text-black">{text}</p>;
}

export function ReceiptRevisionMeta({
  revisedAt,
  editReason,
}: {
  revisedAt?: string;
  editReason?: string;
}) {
  if (!revisedAt && !editReason?.trim()) return null;
  return (
    <>
      {revisedAt && (
        <ReceiptMetaSingle text={`แก้ไขเมื่อ: ${formatReceiptDateTime(revisedAt)}`} />
      )}
      {editReason?.trim() && <ReceiptMetaSingle text={`เหตุผล: ${editReason.trim()}`} />}
    </>
  );
}

export function ReceiptItemTableHeader() {
  return (
    <table className="rcpt-tbl receipt-thermal-table w-full table-fixed border-collapse">
      <colgroup>
        <col style={{ width: "56%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "31%" }} />
      </colgroup>
      <thead>
        <tr className="rcpt-th text-[10.5px] font-extrabold uppercase tracking-wide text-black">
          <th className="pb-0.5 text-left">รายการ</th>
          <th className="pb-0.5 text-center">จำนวน</th>
          <th className="pb-0.5 text-right">รวม</th>
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
    <div className="rcpt-row py-[3px] text-black">
      <table className="rcpt-tbl receipt-thermal-table w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: "56%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "31%" }} />
        </colgroup>
        <tbody>
          <tr className="align-top">
            <td className="pr-1 text-[12px] font-semibold leading-snug">{title}</td>
            <td className="c-qty whitespace-nowrap px-0.5 text-center text-[12px] font-semibold tabular-nums">
              {qty}
            </td>
            <td className="c-amt whitespace-nowrap pl-1 text-right text-[12px] font-semibold tabular-nums">
              {amount}
            </td>
          </tr>
        </tbody>
      </table>
      {hint && <p className="rcpt-row-hint mt-px text-[10px] font-medium text-black">{hint}</p>}
    </div>
  );
}

export function ReceiptSummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
  /** @deprecated ใช้ ReceiptTotalBand สำหรับยอดสุทธิแทน */
  large?: boolean;
}) {
  return (
    <div
      className={`rcpt-sum flex items-baseline justify-between gap-2.5 text-[11.5px] text-black ${
        bold ? "rcpt-sum--bold font-extrabold" : "font-medium"
      }`}
    >
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 whitespace-nowrap tabular-nums">{value}</span>
    </div>
  );
}

/** ยอดสุทธิ — เส้นคั่นหนา + ตัวหนาใหญ่ (สไตล์เดียวกับใบพิมพ์ thermal จริง) */
export function ReceiptTotalBand({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-black">
      <ReceiptDivider total />
      <div className="rcpt-total flex items-baseline justify-between gap-2.5">
        <span className="lbl text-[14px] font-extrabold tracking-wide">{label}</span>
        <span className="val whitespace-nowrap text-[18px] font-extrabold tabular-nums">{value}</span>
      </div>
      <ReceiptDivider total />
    </div>
  );
}

export function ReceiptFooter({ text, note }: { text: string; note?: string }) {
  return (
    <div className="rcpt-foot text-center text-black">
      <ReceiptDivider dashed />
      <p className="rcpt-foot-main pt-1 text-center text-[11.5px] font-extrabold leading-snug">
        {text}
      </p>
      {note && (
        <p className="rcpt-foot-note mt-0.5 text-[9px] font-medium leading-snug">{note}</p>
      )}
    </div>
  );
}
