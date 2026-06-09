"use client";

import { useState } from "react";
import type { Category, Transaction } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { TransactionEditModal } from "@/components/transactions/TransactionEditModal";
import { TransactionVoidModal } from "@/components/transactions/TransactionVoidModal";
import { DataTable } from "./DataTable";
import { Pencil, Ban, Receipt } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onChanged?: () => void;
  onPreviewReceipt?: (transaction: Transaction) => void;
  onSelectTransaction?: (transaction: Transaction) => void;
  selectedTransactionId?: string;
  stickyHeader?: boolean;
  highlightVariant?: "income" | "expense";
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
  onPreviewReceipt,
  onSelectTransaction,
  selectedTransactionId,
  stickyHeader,
  highlightVariant = "income",
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
            {onPreviewReceipt && row.type === "income" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewReceipt(row);
                }}
                className="touch-target rounded-xl p-3 text-text-muted transition-colors hover:bg-income-light hover:text-income"
                aria-label="ดูใบเสร็จ"
                title="ดูใบเสร็จ"
              >
                <Receipt size={22} />
              </button>
            )}
            {onPreviewReceipt && row.type === "expense" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewReceipt(row);
                }}
                className="touch-target rounded-xl p-3 text-text-muted transition-colors hover:bg-expense-light hover:text-expense"
                aria-label="ดูใบบันทึกรายจ่าย"
                title="ดูใบบันทึกรายจ่าย"
              >
                <Receipt size={22} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTxn(row);
              }}
              className="touch-target rounded-xl p-3 text-text-muted transition-colors hover:bg-surface-hover hover:text-brand"
              aria-label="แก้ไขรายการ"
            >
              <Pencil size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setVoidingTxn(row);
              }}
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

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-text-muted">ยังไม่มีรายการ</p>;
  }

  return (
    <>
      <div className="space-y-3 2xl:hidden">
        {transactions.map((row) => {
          const { label, color } = categorySummary(row, categoryMap);
          const payment =
            PAYMENT_METHODS.find((p) => p.value === row.paymentMethod)?.label ??
            row.paymentMethod;
          const voided = row.status === "void";
          const selected = !!selectedTransactionId && row.id === selectedTransactionId;
          return (
            <div
              key={row.id}
              role={onSelectTransaction ? "button" : undefined}
              tabIndex={onSelectTransaction ? 0 : undefined}
              onClick={onSelectTransaction ? () => onSelectTransaction(row) : undefined}
              onKeyDown={
                onSelectTransaction
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectTransaction(row);
                      }
                    }
                  : undefined
              }
              className={`rounded-2xl border-2 bg-surface-elevated p-4 shadow-sm ${
                selected
                  ? highlightVariant === "expense"
                    ? "border-expense/50 bg-expense-light/30"
                    : "border-income/50 bg-income-light/30"
                  : "border-border-default"
              } ${onSelectTransaction ? "cursor-pointer active:scale-[0.99]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-main">{row.title || "รายการ"}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    <DateTimeDisplay iso={row.createdAt} />
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                    {color && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    {label} · {payment}
                  </p>
                  {voided && (
                    <p className="mt-1 text-sm font-bold text-error">ยกเลิกแล้ว</p>
                  )}
                </div>
                <p
                  className={`shrink-0 text-xl font-black ${
                    voided
                      ? "text-text-muted line-through"
                      : row.type === "income"
                        ? "text-income"
                        : "text-expense"
                  }`}
                >
                  {row.type === "income" ? "+" : "-"}
                  {formatCurrency(row.amount)}
                </p>
              </div>
              {!voided && (
                <div className="mt-3 flex gap-2 border-t border-border-default pt-3">
                  {onPreviewReceipt && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewReceipt(row);
                      }}
                      className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface-hover font-bold text-text-secondary active:scale-[0.98]"
                    >
                      <Receipt size={20} />
                      ใบเสร็จ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTxn(row);
                    }}
                    className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface-hover font-bold text-brand active:scale-[0.98]"
                  >
                    <Pencil size={20} />
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVoidingTxn(row);
                    }}
                    className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-expense-light font-bold text-expense active:scale-[0.98]"
                  >
                    <Ban size={20} />
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden 2xl:block">
        <DataTable
          columns={columns}
          data={transactions}
          emptyMessage="ยังไม่มีรายการ"
          getRowKey={(row) => row.id}
          isRowSelected={(row) => !!selectedTransactionId && row.id === selectedTransactionId}
          onRowClick={onSelectTransaction}
          stickyHeader={stickyHeader}
          highlightVariant={highlightVariant}
        />
      </div>
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
