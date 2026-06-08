"use client";

import { useState } from "react";
import type { Category, Transaction } from "@/types";
import { PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { deleteTransactionApi } from "@/lib/api/client";
import { TransactionEditModal } from "@/components/transactions/TransactionEditModal";
import { TransactionVoidModal } from "@/components/transactions/TransactionVoidModal";
import { DataTable } from "./DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Pencil, Trash2, Ban } from "lucide-react";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [voidingTxn, setVoidingTxn] = useState<Transaction | null>(null);

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTransactionApi(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onChanged?.();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  const deletingTxn = deletingId
    ? transactions.find((t) => t.id === deletingId)
    : null;

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
      className: "w-28",
      render: (row: Transaction) =>
        row.status === "void" ? null : (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setEditingTxn(row)}
              className="rounded-xl p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-brand"
              aria-label="แก้ไขรายการ"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              onClick={() => setVoidingTxn(row)}
              className="rounded-xl p-2 text-text-muted transition-colors hover:bg-expense-light hover:text-expense"
              aria-label="ยกเลิกรายการ"
            >
              <Ban size={18} />
            </button>
            <button
              type="button"
              onClick={() => openDeleteDialog(row.id)}
              className="rounded-xl p-2 text-text-muted transition-colors hover:bg-error-light hover:text-error"
              aria-label="ลบรายการ"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={transactions} emptyMessage="ยังไม่มีรายการ" />
      <Dialog
        open={deleteDialogOpen}
        title="ลบรายการนี้?"
        message={
          deleteError
            ? deleteError
            : deletingTxn
              ? `ลบ "${deletingTxn.title}" (${formatCurrency(deletingTxn.amount)}) — ใช้เมื่อคีย์ผิดพลาด ไม่สามารถกู้คืนได้`
              : "ลบรายการนี้ — ใช้เมื่อคีย์ผิดพลาด ไม่สามารถกู้คืนได้"
        }
        confirmLabel={deleting ? "กำลังลบ..." : "ลบ"}
        cancelLabel="ยกเลิก"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
            setDeletingId(null);
            setDeleteError(null);
          }
        }}
      />
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
