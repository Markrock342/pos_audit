"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { printTransactionDocument } from "@/lib/hardware/printTransactionDocument";
import type { Category, Transaction } from "@/types";
import { Printer, X } from "lucide-react";

interface TransactionEditPrintPromptProps {
  transaction: Transaction;
  editReason: string;
  categories: Category[];
  onDone: () => void;
}

export function TransactionEditPrintPrompt({
  transaction,
  editReason,
  categories,
  onDone,
}: TransactionEditPrintPromptProps) {
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePrint = async () => {
    setPrinting(true);
    setMessage(null);
    try {
      const result = await printTransactionDocument(transaction, {
        categories,
        isRevision: true,
        editReason,
      });
      setMessage(result.success ? result.message : result.message);
      if (result.success) {
        setTimeout(onDone, 600);
      }
    } catch {
      setMessage("พิมพ์ไม่สำเร็จ — ลองใหม่อีกครั้ง");
    } finally {
      setPrinting(false);
    }
  };

  const docLabel = transaction.type === "income" ? "ใบเสร็จ" : "ใบบันทึกรายจ่าย";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-2 border-border-default bg-surface-elevated p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-text-main">บันทึกการแก้ไขแล้ว</h3>
            <p className="mt-1 text-sm text-text-secondary">
              พิมพ์{docLabel}ฉบับแก้ไขไหม? (เลขที่เดิม · ไม่เปิดลิ้นชัก)
            </p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl p-2 text-text-muted hover:bg-surface-hover"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        {message && (
          <p className="mt-3 rounded-xl bg-surface-inset px-3 py-2 text-sm text-text-secondary">
            {message}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            className="flex-1 gap-2"
            size="lg"
            onClick={() => void handlePrint()}
            disabled={printing}
          >
            <Printer size={18} />
            {printing ? "กำลังพิมพ์..." : "พิมพ์ฉบับแก้ไข"}
          </Button>
          <Button className="flex-1" variant="outline" size="lg" onClick={onDone} disabled={printing}>
            ไม่พิมพ์
          </Button>
        </div>
      </div>
    </div>
  );
}
