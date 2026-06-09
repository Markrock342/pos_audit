"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  type?: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ type = "info", message, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per toast mount
  }, [duration]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const styles = {
    success: "bg-income text-text-inverse",
    error: "bg-expense text-text-inverse",
    info: "bg-brand text-text-inverse",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-50 flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl transition-all duration-300 min-h-[64px] 2xl:bottom-6 2xl:right-6",
        styles[type],
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <Icon size={24} />
      <span className="text-base font-semibold">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="ml-2 opacity-70 active:opacity-100 transition-opacity"
      >
        <X size={20} />
      </button>
    </div>
  );
}
