import type { Category } from "@/types";

export const mockCategories: Category[] = [
  { id: "cat-1", name: "เครื่องดื่ม", type: "income", color: "#8B5E3C" },
  { id: "cat-2", name: "เบเกอรี่", type: "income", color: "#D4A574" },
  { id: "cat-3", name: "เมล็ดกาแฟ/วัตถุดิบ", type: "expense", color: "#6B8E23" },
  { id: "cat-4", name: "ค่าเช่า", type: "expense", color: "#B22222" },
  { id: "cat-5", name: "ค่าน้ำ-ค่าไฟ", type: "expense", color: "#4682B4" },
  { id: "cat-6", name: "อุปกรณ์ร้าน", type: "expense", color: "#708090" },
];
