"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const MAX_PIN = 4;
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"] as const;

interface PinPadDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  error?: string | null;
  onComplete: (pin: string) => void;
  onCancel: () => void;
}

export function PinPadDialog({
  open,
  title,
  subtitle,
  error,
  onComplete,
  onCancel,
}: PinPadDialogProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setPin("");
      submittedRef.current = false;
    }
  }, [open, title]);

  useEffect(() => {
    if (error) {
      setShake(true);
      setPin("");
      submittedRef.current = false;
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (!open || pin.length < MAX_PIN || submittedRef.current) return;
    submittedRef.current = true;
    onComplete(pin);
  }, [open, pin, onComplete]);

  const handleKey = useCallback((key: (typeof PIN_KEYS)[number]) => {
    setPin((prev) => {
      if (key === "clear") return "";
      if (key === "backspace") return prev.slice(0, -1);
      if (prev.length >= MAX_PIN) return prev;
      return prev + key;
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-2 border-border-default bg-surface-elevated p-6 shadow-2xl sm:rounded-3xl sm:mx-4">
        <h3 className="text-xl font-bold text-text-main">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        {error && (
          <p className="mt-2 text-sm font-bold text-expense" role="alert">
            {error}
          </p>
        )}

        <div className={cn("mt-4 flex justify-center gap-3", shake && "animate-shake")}>
          {Array.from({ length: MAX_PIN }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-colors",
                i < pin.length ? "border-brand bg-brand" : "border-border-default bg-transparent"
              )}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {PIN_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className={cn(
                "tablet-touch-row flex min-h-[56px] items-center justify-center rounded-2xl text-xl font-bold",
                key === "clear" || key === "backspace"
                  ? "bg-surface-inset text-text-muted active:bg-surface-hover"
                  : "bg-surface-inset text-text-main active:bg-brand/15 active:text-brand"
              )}
            >
              {key === "clear" ? "C" : key === "backspace" ? <Delete size={22} /> : key}
            </button>
          ))}
        </div>

        <Button type="button" variant="outline" className="mt-4 w-full" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
