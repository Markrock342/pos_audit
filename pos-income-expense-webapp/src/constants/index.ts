import type { PaymentMethod } from "@/types";

export const APP_NAME = "POS Income Expense";
export const SHOP_NAME = "Coffee Shop POS";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "เงินสด" },
  { value: "transfer", label: "โอนเงิน" },
  { value: "card", label: "บัตรเครดิต/เดบิต" },
  { value: "qr", label: "QR Payment" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/income", label: "รายรับ", icon: "💰" },
  { href: "/expense", label: "รายจ่าย", icon: "💸" },
  { href: "/categories", label: "หมวดหมู่", icon: "🏷️" },
  { href: "/reports", label: "รายงาน", icon: "📈" },
  { href: "/settings", label: "ตั้งค่า", icon: "⚙️" },
] as const;
