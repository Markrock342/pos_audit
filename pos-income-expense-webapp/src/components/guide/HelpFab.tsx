"use client";

import { useEffect, useState } from "react";
import { DailyFlowGuide } from "./DailyFlowGuide";
import { X } from "lucide-react";

export function HelpFab() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-black text-text-inverse shadow-[0_4px_16px_rgba(255,107,53,0.45)] transition-transform active:scale-95"
        aria-label="คู่มือการใช้งาน"
        title="คู่มือการใช้งาน"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
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
      )}
    </>
  );
}
