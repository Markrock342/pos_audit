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
}

export function AmountNumpad({ value, onChange, integerOnly }: AmountNumpadProps) {
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

  return (
    <div className="grid grid-cols-3 gap-3">
      {(integerOnly
        ? ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0"]
        : ["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "."]
      ).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handleKey(key)}
          className={cn(
            "min-h-[72px] rounded-2xl text-3xl font-bold shadow-md active:scale-95 text-text-main xl:min-h-[76px]",
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
        className="min-h-[72px] rounded-2xl bg-surface-hover text-3xl font-bold text-text-secondary active:bg-border-default shadow-md active:scale-95 xl:min-h-[76px]"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={() => handleKey("00")}
        className="min-h-[72px] rounded-2xl bg-surface-hover text-3xl font-bold text-text-main active:bg-border-default shadow-md active:scale-95 xl:min-h-[76px]"
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
  onClick?: () => void;
}

export function AmountDisplay({ value, label, active, onClick }: AmountDisplayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border-2 px-5 py-4 text-left shadow-sm transition-all",
        active
          ? "border-brand bg-brand/5 ring-4 ring-brand-ring"
          : "border-border-default bg-surface-elevated active:bg-surface-hover"
      )}
    >
      <p className="mb-1 text-sm font-bold text-text-secondary">{label}</p>
      <div className="flex items-center">
        <span className="text-3xl font-bold text-text-muted">฿</span>
        <span className="ml-2 text-4xl font-black text-text-main xl:text-5xl">
          {formatDisplay(value)}
        </span>
      </div>
    </button>
  );
}
