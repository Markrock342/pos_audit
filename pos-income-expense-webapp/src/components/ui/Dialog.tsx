"use client";

import { useEffect } from "react";
import { Button } from "./Button";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Dialog({
  open,
  title,
  message,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  onConfirm,
  onCancel,
}: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-border-default bg-surface-elevated p-6 shadow-2xl mx-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-text-main">{title}</h3>
          <button
            onClick={onCancel}
            className="rounded-xl p-2 text-text-muted active:bg-surface-hover active:text-text-main"
            aria-label="ปิด"
          >
            <X size={24} />
          </button>
        </div>
        <p className="mt-3 text-lg text-text-secondary leading-relaxed">
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="danger"
            size="lg"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
