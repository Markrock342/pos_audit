import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "income";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand text-text-inverse active:bg-brand-hover shadow-[0_2px_8px_rgba(255,107,53,0.35)] active:shadow-[0_4px_12px_rgba(255,107,53,0.45)]",
  secondary: "bg-surface-hover text-text-main active:bg-border-default shadow-[0_1px_4px_rgba(15,23,42,0.06)] active:shadow-[0_2px_8px_rgba(15,23,42,0.1)]",
  outline: "border-2 border-border-default bg-surface-elevated text-text-secondary active:border-text-muted active:bg-surface-hover shadow-[0_1px_4px_rgba(15,23,42,0.06)] active:shadow-[0_2px_8px_rgba(15,23,42,0.1)]",
  ghost: "text-text-secondary active:bg-surface-hover",
  danger: "bg-expense text-text-inverse active:bg-expense-hover shadow-[0_2px_8px_rgba(239,68,68,0.35)] active:shadow-[0_4px_12px_rgba(239,68,68,0.45)]",
  income: "bg-income text-text-inverse active:bg-income-hover shadow-[0_2px_8px_rgba(16,185,129,0.35)] active:shadow-[0_4px_12px_rgba(16,185,129,0.45)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[56px] h-14 px-5 text-base",
  md: "min-h-[56px] h-14 px-6 text-base",
  lg: "min-h-[64px] h-16 px-8 text-lg",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
