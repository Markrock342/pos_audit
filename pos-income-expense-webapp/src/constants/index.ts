import type { PaymentMethod } from "@/types";
import {
  LayoutDashboard,
  DollarSign,
  ArrowDownCircle,
  Tag,
  TrendingUp,
  Settings,
} from "lucide-react";

export const APP_NAME = "POS Income Expense";
export const SHOP_NAME = "ร้านค้า";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "เงินสด" },
  { value: "transfer", label: "โอนเงิน" },
  { value: "cheque", label: "เช็ค" },
  { value: "card", label: "บัตรเครดิต/เดบิต" },
  { value: "other", label: "อื่นๆ" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "รายรับ", icon: DollarSign },
  { href: "/expense", label: "รายจ่าย", icon: ArrowDownCircle },
  { href: "/categories", label: "หมวดหมู่", icon: Tag },
  { href: "/reports", label: "รายงาน", icon: TrendingUp },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
] as const;
