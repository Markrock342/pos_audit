"use client";

import { useEffect, useState } from "react";
import { DailyFlowGuide } from "./DailyFlowGuide";
import { X } from "lucide-react";

interface HelpGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpGuideDialog({ open, onOpenChange }: HelpGuideDialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-labelledby="help-guide-title"
        className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-border-default bg-surface-elevated shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-default px-4 py-3">
          <h2 id="help-guide-title" className="text-base font-black text-text-main">
            คู่มือ
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl p-2 text-text-muted hover:bg-surface-hover"
            aria-label="ปิดคู่มือ"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <DailyFlowGuide />
        </div>
      </div>
    </div>
  );
}

export function useHelpGuide() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
