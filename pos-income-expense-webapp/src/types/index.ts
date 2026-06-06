export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type TransactionType = "income" | "expense";

export type PaymentMethod = "cash" | "transfer" | "card" | "qr";

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  title: string;
  amount: number;
  note?: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface Receipt {
  id: string;
  transactionId: string;
  receiptNumber: string;
  printedAt?: string;
}

export interface DashboardSummary {
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  netProfit: number;
  transactionCount: number;
}
