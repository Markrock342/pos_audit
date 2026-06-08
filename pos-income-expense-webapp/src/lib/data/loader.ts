import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getCategories } from "@/lib/services/db/categories";
import { getTransactions } from "@/lib/services/db/transactions";
import type { Category, Transaction, TransactionType } from "@/types";

type TransactionFilters = {
  type?: TransactionType;
  status?: "active" | "void";
  startDate?: string;
  endDate?: string;
};

export async function loadTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  return getTransactions(DEFAULT_ORG_ID, filters);
}

export async function loadCategories(type?: TransactionType): Promise<Category[]> {
  return getCategories(DEFAULT_ORG_ID, type);
}
