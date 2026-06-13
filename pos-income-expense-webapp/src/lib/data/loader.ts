import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getCategories } from "@/lib/services/db/categories";
import { getTransactions } from "@/lib/services/db/transactions";
import { getBusinessToday, shiftBusinessDate } from "@/lib/utils/businessDate";
import type { Category, Transaction, TransactionType } from "@/types";

type TransactionFilters = {
  type?: TransactionType;
  status?: "active" | "void";
  startDate?: string;
  endDate?: string;
};

type TransactionLoadOptions = {
  includeLineItems?: boolean;
  limit?: number;
};

export async function loadTransactions(
  filters?: TransactionFilters,
  options?: TransactionLoadOptions
): Promise<Transaction[]> {
  return getTransactions(DEFAULT_ORG_ID, filters, options);
}

export async function loadCategories(type?: TransactionType): Promise<Category[]> {
  return getCategories(DEFAULT_ORG_ID, type);
}

export async function loadRecentTransactions(limit = 5): Promise<Transaction[]> {
  return getTransactions(
    DEFAULT_ORG_ID,
    { status: "active" },
    { includeLineItems: false, limit }
  );
}

export async function loadChartTransactions(days = 6): Promise<Transaction[]> {
  const startDate = shiftBusinessDate(getBusinessToday(), -(days - 1));

  return getTransactions(
    DEFAULT_ORG_ID,
    { status: "active", startDate },
    { includeLineItems: false }
  );
}
