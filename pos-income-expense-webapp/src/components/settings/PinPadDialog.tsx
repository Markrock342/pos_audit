"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const MAX_PIN = 4;
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"] as const;

/** คืน false เมื่อรหัสผิด — dialog จะรีเซ็ตให้กรอกใหม่ทันที */
export type PinCompleteResult = boolean | void;

interface PinPadDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  error?: string | null;
  onComplete: (pin: string) => PinCompleteResult | Promise<PinCompleteResult>;
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
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const prevErrorRef = useRef<string | null>(null);

  const resetForRetry = useCallback(() => {
    setPin("");
    submittedRef.current = false;
    setShake(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShake(false), 500);
  }, []);

  useEffect(() => {
    if (open) {
      setPin("");
      submittedRef.current = false;
      setShake(false);
    }
  }, [open, title]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || pin.length < MAX_PIN || submittedRef.current) return;

    submittedRef.current = true;
    const pinValue = pin;

    void (async () => {
      try {
        const result = await Promise.resolve(onCompleteRef.current(pinValue));
        if (result === false) {
          resetForRetry();
        }
      } catch {
        resetForRetry();
      }
    })();
  }, [open, pin, resetForRetry]);

  /** สำรองเมื่อ parent ตั้ง error ใหม่ขณะกรอกครบ 4 หลัก (เช่น ใช้ void handler) */
  useEffect(() => {
    if (!open) {
      prevErrorRef.current = null;
      return;
    }
    if (!error) {
      prevErrorRef.current = null;
      return;
    }
    if (error !== prevErrorRef.current && pin.length === MAX_PIN) {
      prevErrorRef.current = error;
      resetForRetry();
    }
  }, [open, error, pin, resetForRetry]);

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
