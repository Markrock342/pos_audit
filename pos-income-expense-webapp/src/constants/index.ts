import type { PaymentMethod } from "@/types";
import {
  LayoutDashboard,
  DollarSign,
  ArrowDownCircle,
  Tag,
  TrendingUp,
  Settings,
  Wallet,
  History,
  Scale,
} from "lucide-react";

export const APP_NAME = "สมุดรายรับ-รายจ่าย";
export const SHOP_NAME = "บัญชีร้าน";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "เงินสด" },
  { value: "transfer", label: "โอนเงิน" },
  { value: "cheque", label: "เช็ค" },
  { value: "card", label: "บัตรเครดิต/เดบิต" },
  { value: "other", label: "อื่นๆ" },
];

export type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: typeof LayoutDashboard;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/** เมนูแยกกลุ่ม — ให้ user เข้าใจว่าทำอะไรเมื่อไหร่ */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "ทำทุกวัน",
    items: [
      { href: "/dashboard", label: "ภาพรวม", hint: "ยอดวันนี้", icon: LayoutDashboard },
      { href: "/income", label: "รายรับ", hint: "บันทึกเงินเข้า", icon: DollarSign },
      { href: "/expense", label: "รายจ่าย", hint: "บันทึกเงินออก", icon: ArrowDownCircle },
      { href: "/cash-count", label: "ปิดยอด", hint: "สรุปเงินสด + ถอน", icon: Wallet },
    ],
  },
  {
    title: "สรุปและตรวจสอบ",
    items: [
      { href: "/balance", label: "ยอดคงเหลือ", hint: "เงินสด+บัญชี ทั้งเดือน", icon: Scale },
      { href: "/reports", label: "รายงาน", hint: "กราฟ / ส่งออก CSV", icon: TrendingUp },
      { href: "/history", label: "ประวัติรายการ", hint: "ดูแก้ไข / ยกเลิก", icon: History },
    ],
  },
  {
    title: "ตั้งค่า",
    items: [
      { href: "/categories", label: "หมวดหมู่", hint: "ชื่อประเภทรายการ", icon: Tag },
      { href: "/settings", label: "ตั้งค่า", hint: "ยอดยกมา + ข้อมูลร้าน", icon: Settings },
    ],
  },
];

/** flat list สำหรับโค้ดเดิมที่อ้าง NAV_ITEMS */
export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

/** เมนูล่าง tablet 10 นิ้ว — งานประจำวัน */
export const BOTTOM_NAV_PRIMARY = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard, match: "/dashboard" },
  { href: "/income/add", label: "รายรับ", icon: DollarSign, match: "/income" },
  { href: "/expense/add", label: "รายจ่าย", icon: ArrowDownCircle, match: "/expense" },
  { href: "/cash-count", label: "ปิดยอด", icon: Wallet, match: "/cash-count" },
] as const;

/** เมนูเพิ่มเติมใน tablet (sheet) */
export const TABLET_MORE_NAV = [
  { href: "/income", label: "รายการรายรับ", icon: DollarSign },
  { href: "/expense", label: "รายการรายจ่าย", icon: ArrowDownCircle },
  { href: "/balance", label: "ยอดคงเหลือ", icon: Scale },
  { href: "/reports", label: "รายงาน", icon: TrendingUp },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/categories", label: "หมวดหมู่", icon: Tag },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
] as const;
