"use client";

import { useState } from "react";
import type { Category, Transaction } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { TransactionEditModal } from "@/components/transactions/TransactionEditModal";
import { TransactionVoidModal } from "@/components/transactions/TransactionVoidModal";
import { DataTable } from "./DataTable";
import { Pencil, Ban } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onChanged?: () => void;
}

export function TransactionTable({
  transactions,
  categories,
  onChanged,
}: TransactionTableProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [voidingTxn, setVoidingTxn] = useState<Transaction | null>(null);

  const columns = [
    {
      key: "datetime",
      header: "วันที่ / เวลา",
      render: (row: Transaction) => (
        <div>
          <DateTimeDisplay iso={row.createdAt} />
          {row.transactionDate &&
            row.transactionDate !== row.createdAt.slice(0, 10) && (
              <p className="mt-1 text-xs text-text-muted">
                วันที่รายการ: {formatDateShort(row.transactionDate)}
              </p>
            )}
        </div>
      ),
    },
    {
      key: "title",
      header: "รายการ",
      render: (row: Transaction) => (
        <div>
          <p className="font-medium">{row.title}</p>
          {row.note && <p className="text-xs text-text-muted">{row.note}</p>}
          {row.status === "void" && (
            <p className="text-xs font-bold text-error">ยกเลิกแล้ว</p>
          )}
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
            row.status === "void"
              ? "font-semibold text-text-muted line-through"
              : row.type === "income"
                ? "font-semibold text-income"
                : "font-semibold text-expense"
          }
        >
          {row.type === "income" ? "+" : "-"}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (row: Transaction) =>
        row.status === "void" ? null : (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingTxn(row)}
              className="touch-target rounded-xl p-3 text-text-muted transition-colors hover:bg-surface-hover hover:text-brand"
              aria-label="แก้ไขรายการ"
            >
              <Pencil size={22} />
            </button>
            <button
              type="button"
              onClick={() => setVoidingTxn(row)}
              className="touch-target rounded-xl p-3 text-text-muted transition-colors hover:bg-expense-light hover:text-expense"
              aria-label="ยกเลิกรายการ"
              title="ยกเลิกรายการ (ต้องระบุเหตุผล)"
            >
              <Ban size={22} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={transactions} emptyMessage="ยังไม่มีรายการ" />
      {editingTxn && (
        <TransactionEditModal
          transaction={editingTxn}
          categories={categories}
          open={!!editingTxn}
          onClose={() => setEditingTxn(null)}
          onSaved={() => onChanged?.()}
        />
      )}
      {voidingTxn && (
        <TransactionVoidModal
          transaction={voidingTxn}
          open={!!voidingTxn}
          onClose={() => setVoidingTxn(null)}
          onVoided={() => onChanged?.()}
        />
      )}
    </>
  );
}
