import { loadCategories } from "@/lib/data/loader";
import { AddExpensePageClient } from "./AddExpensePageClient";

// โหลดหมวดสดทุกครั้ง (ไม่ prerender ค้าง) — หมวดที่เพิ่มใหม่ต้องขึ้นทันที
export const dynamic = "force-dynamic";

export default async function AddExpensePage() {
  const categories = await loadCategories("expense");
  return <AddExpensePageClient categories={categories} />;
}
