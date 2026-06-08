import type { Transaction } from "@/types";

const CSV_HEADERS = [
  "วันที่",
  "ประเภท",
  "ชื่อหัวใบ",
  "รายการย่อย",
  "หมวดหมู่",
  "จำนวน",
  "ราคาต่อหน่วย",
  "ยอดบรรทัด",
  "ยอดรวมหัวใบ",
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
    const lines =
      t.lineItems && t.lineItems.length > 0
        ? t.lineItems
        : [
            {
              id: "legacy",
              transactionId: t.id,
              sortOrder: 0,
              title: t.title,
              quantity: 1,
              unitPrice: t.amount,
              lineAmount: t.amount,
              categoryId: t.categoryId,
            },
          ];

    for (const line of lines) {
      const row = [
        escapeCsv(t.transactionDate),
        t.type === "income" ? "รายรับ" : "รายจ่าย",
        escapeCsv(t.title),
        escapeCsv(line.title),
        escapeCsv(categoryNames.get(line.categoryId) ?? ""),
        escapeCsv(line.quantity),
        escapeCsv(line.unitPrice),
        escapeCsv(line.lineAmount),
        escapeCsv(t.amount),
        escapeCsv(t.paymentMethod),
        escapeCsv(t.referenceNo),
        escapeCsv(t.note),
        t.status === "active" ? "ปกติ" : "ยกเลิก",
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\n");
}
