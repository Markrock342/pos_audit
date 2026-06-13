"use client";

import { cn } from "@/lib/utils/cn";

function formatDisplay(val: string) {
  if (!val || val === "0") return "0";
  const parts = val.split(".");
  const formattedInt = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decPart = parts[1] ?? "";
  return decPart !== "" ? `${formattedInt}.${decPart}` : formattedInt;
}

interface AmountNumpadProps {
  value: string;
  onChange: (value: string) => void;
  /** จำนวนเต็มบาท — ซ่อนปุ่ม . */
  integerOnly?: boolean;
  /** ปุ่มใหญ่สำหรับ POS touch (min 56px) */
  touch?: boolean;
}

export function AmountNumpad({ value, onChange, integerOnly, touch }: AmountNumpadProps) {
  const handleKey = (key: string) => {
    let next: string;
    if (key === "C") {
      next = "0";
    } else if (key === "⌫") {
      next = value.slice(0, -1) || "0";
    } else if (key === ".") {
      next = value.includes(".") ? value : value + ".";
    } else if (key === "00") {
      next = value === "0" ? "0" : value + "00";
    } else {
      next = value === "0" ? key : value + key;
    }
    onChange(next);
  };

  const keyClass = cn(
    "pos-numpad-key rounded-xl font-bold shadow-md active:scale-95 text-text-main",
    touch
      ? "min-h-14 text-2xl"
      : "min-h-[44px] text-xl"
  );

  return (
    <div
      className={cn(
        "pos-numpad-grid grid w-full grid-cols-3",
        touch ? "gap-2" : "gap-1.5 sm:gap-2"
      )}
    >
      {(integerOnly
        ? ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0"]
        : ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "."]
      ).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handleKey(key)}
          className={cn(
            keyClass,
            key === "C"
              ? "bg-expense-light text-expense active:bg-expense/20"
              : "bg-surface-hover active:bg-border-default"
          )}
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        onClick={() => handleKey("⌫")}
        className={cn(keyClass, "bg-surface-hover text-text-secondary active:bg-border-default")}
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={() => handleKey("00")}
        className={cn(keyClass, "col-span-2 bg-surface-hover active:bg-border-default")}
      >
        00
      </button>
    </div>
  );
}

interface AmountDisplayProps {
  value: string;
  label: string;
  active?: boolean;
  compact?: boolean;
  large?: boolean;
  onClick?: () => void;
}

export function AmountDisplay({ value, label, active, compact, large, onClick }: AmountDisplayProps) {
  const className = cn(
    "w-full rounded-xl border-2 text-left shadow-sm transition-all",
    large && "px-4 py-3",
    compact && !large && "px-3 py-2",
    !compact && !large && "px-4 py-3 2xl:rounded-2xl 2xl:px-5 2xl:py-4",
    active
      ? "border-brand bg-brand/5 ring-2 ring-brand-ring"
      : "border-border-default bg-surface-elevated active:bg-surface-hover"
  );

  const content = (
    <>
      <p
        className={cn(
          "font-bold text-text-secondary",
          large ? "mb-1 text-sm" : compact ? "mb-0.5 text-xs" : "mb-1 text-sm"
        )}
      >
        {label}
      </p>
      <div className="flex items-baseline">
        <span
          className={cn(
            "font-bold text-text-muted",
            large ? "text-2xl" : compact ? "text-xl" : "text-3xl"
          )}
        >
          ฿
        </span>
        <span
          className={cn(
            "ml-2 font-black tabular-nums text-text-main",
            large ? "text-4xl" : compact ? "text-2xl" : "text-3xl 2xl:text-4xl"
          )}
        >
          {formatDisplay(value)}
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
