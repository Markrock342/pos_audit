import { loadCategories } from "@/lib/data/loader";
import { AddExpensePageClient } from "./AddExpensePageClient";

export default async function AddExpensePage() {
  const categories = await loadCategories("expense");
  return <AddExpensePageClient categories={categories} />;
}
