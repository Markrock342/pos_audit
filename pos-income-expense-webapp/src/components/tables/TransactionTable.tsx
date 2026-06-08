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

function lineCount(row: Transaction): number {
  return row.lineItems?.length ?? 1;
}

function categorySummary(
  row: Transaction,
  categoryMap: Record<string, Category>
): { label: string; color?: string } {
  const lines = row.lineItems ?? [];
  if (lines.length === 0) {
    const cat = categoryMap[row.categoryId];
    return { label: cat?.name ?? "-", color: cat?.color };
  }
  const uniqueIds = [...new Set(lines.map((l) => l.categoryId))];
  if (uniqueIds.length === 1) {
    const cat = categoryMap[uniqueIds[0]];
    return { label: cat?.name ?? "-", color: cat?.color };
  }
  return { label: `${uniqueIds.length} หมวด` };
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
          <p className="text-xs text-text-muted">
            {lineCount(row)} รายการย่อย
            {row.lineItems && row.lineItems.length > 0 && (
              <> — {row.lineItems[0].title}{lineCount(row) > 1 ? " …" : ""}</>
            )}
          </p>
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
        const { label, color } = categorySummary(row, categoryMap);
        return color ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ) : (
          <span className="text-text-secondary">{label}</span>
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
