import { loadCategories } from "@/lib/data/loader";
import { AddIncomePageClient } from "./AddIncomePageClient";

// โหลดหมวดสดทุกครั้ง (ไม่ prerender ค้าง) — หมวดที่เพิ่มใหม่ต้องขึ้นทันที
export const dynamic = "force-dynamic";

export default async function AddIncomePage() {
  const categories = await loadCategories("income");
  return <AddIncomePageClient categories={categories} />;
}
