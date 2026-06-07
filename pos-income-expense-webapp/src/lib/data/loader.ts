import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { mockCategories, mockTransactions } from "@/data/mock";
import { getServerDataSource } from "@/lib/dataSource";
import { getCategories } from "@/lib/services/db/categories";
import { getTransactions } from "@/lib/services/db/transactions";
import type { Category, Transaction, TransactionType } from "@/types";

type TransactionFilters = {
  type?: TransactionType;
  status?: "active" | "void";
  startDate?: string;
  endDate?: string;
};

function filterMockTransactions(filters?: TransactionFilters): Transaction[] {
  return mockTransactions.filter((t) => {
    if (filters?.type && t.type !== filters.type) return false;
    if (filters?.status && t.status !== filters.status) return false;
    if (filters?.startDate && t.transactionDate < filters.startDate) return false;
    if (filters?.endDate && t.transactionDate > filters.endDate) return false;
    return true;
  });
}

export async function loadTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  if ((await getServerDataSource()) === "mock") {
    return filterMockTransactions(filters);
  }
  return getTransactions(DEFAULT_ORG_ID, filters);
}

export async function loadCategories(type?: TransactionType): Promise<Category[]> {
  if ((await getServerDataSource()) === "mock") {
    return type ? mockCategories.filter((c) => c.type === type) : mockCategories;
  }
  return getCategories(DEFAULT_ORG_ID, type);
}
