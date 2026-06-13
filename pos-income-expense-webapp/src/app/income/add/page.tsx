import { loadCategories } from "@/lib/data/loader";
import { AddIncomePageClient } from "./AddIncomePageClient";

export default async function AddIncomePage() {
  const categories = await loadCategories("income");
  return <AddIncomePageClient categories={categories} />;
}
