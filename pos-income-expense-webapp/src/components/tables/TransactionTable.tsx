import type { Category, Transaction } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { DataTable } from "./DataTable";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
}

export function TransactionTable({ transactions, categories }: TransactionTableProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const columns = [
    {
      key: "createdAt",
      header: "วันที่",
      render: (row: Transaction) => formatDateShort(row.transactionDate || row.createdAt),
    },
    {
      key: "title",
      header: "รายการ",
      render: (row: Transaction) => (
        <div>
          <p className="font-medium">{row.title}</p>
          {row.note && <p className="text-xs text-text-muted">{row.note}</p>}
        </div>
      ),
    },
    {
      key: "categoryId",
      header: "หมวดหมู่",
      render: (row: Transaction) => {
        const cat = categoryMap[row.categoryId];
        return cat ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </span>
        ) : (
          "-"
        );
      },
    },
    {
      key: "paymentMethod",
      header: "ช่องทาง",
      render: (row: Transaction) =>
        PAYMENT_METHODS.find((p) => p.value === row.paymentMethod)?.label ?? row.paymentMethod,
    },
    {
      key: "amount",
      header: "จำนวนเงิน",
      className: "text-right",
      render: (row: Transaction) => (
        <span
          className={
            row.type === "income" ? "font-semibold text-income" : "font-semibold text-expense"
          }
        >
          {row.type === "income" ? "+" : "-"}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} data={transactions} emptyMessage="ยังไม่มีรายการ" />;
}
