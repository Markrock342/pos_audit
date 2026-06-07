import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-base font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border-2 border-border-default bg-surface-elevated px-4 py-4 text-base text-text-main placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring",
          error && "border-error focus:border-error focus:ring-error-ring",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-error font-medium">{error}</p>}
    </div>
  );
}
