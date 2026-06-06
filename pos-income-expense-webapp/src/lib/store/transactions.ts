import type { Transaction } from "@/types";

let transactions: Transaction[] = [];

export function getTransactions(type?: Transaction["type"]): Transaction[] {
  if (type) {
    return transactions.filter((transaction) => transaction.type === type);
  }

  return [...transactions];
}

export function addTransaction(
  data: Omit<Transaction, "id" | "createdAt">
): Transaction {
  const newTransaction: Transaction = {
    ...data,
    id: `txn-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  transactions = [newTransaction, ...transactions];
  return newTransaction;
}
