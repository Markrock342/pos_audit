import type { Transaction } from "@/types";

const CSV_HEADERS = [
  "วันที่",
  "ประเภท",
  "รายการ",
  "หมวดหมู่",
  "จำนวนเงิน",
  "ช่องทางชำระ",
  "เลขที่อ้างอิง",
  "หมายเหตุ",
  "สถานะ",
];

function escapeCsv(value: string | number | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function transactionsToCsv(
  transactions: Transaction[],
  categoryNames: Map<string, string>
): string {
  const rows: string[] = [CSV_HEADERS.join(",")];

  for (const t of transactions) {
    const row = [
      escapeCsv(t.transactionDate),
      t.type === "income" ? "รายรับ" : "รายจ่าย",
      escapeCsv(t.title),
      escapeCsv(categoryNames.get(t.categoryId) ?? ""),
      escapeCsv(t.amount),
      escapeCsv(t.paymentMethod),
      escapeCsv(t.referenceNo),
      escapeCsv(t.note),
      t.status === "active" ? "ปกติ" : "ยกเลิก",
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}
