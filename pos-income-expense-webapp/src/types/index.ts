export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  organizationId?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export type TransactionType = "income" | "expense";

export type PaymentMethod = "cash" | "transfer" | "cheque" | "card" | "other";

export type TransactionStatus = "active" | "void";

export interface Transaction {
  id: string;
  organizationId?: string;
  type: TransactionType;
  categoryId: string;
  title: string;
  amount: number;
  note?: string;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  transactionDate: string;
  status: TransactionStatus;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  receiptNo?: string;
  isPrinted: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  organizationId?: string;
  name: string;
  type: TransactionType;
  color: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface FinanceConfig {
  /** ยอดเงินยกมา — เงินสดในลิ้นชัก */
  openingCashBalance?: number;
  /** ยอดเงินยกมา — เงินเก็บ/บัญชี */
  openingSavingsBalance?: number;
  /** เดือนที่ตั้งยอดยกมา (YYYY-MM) */
  openingBalanceMonth?: string;
}

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  phone?: string;
  currency: string;
  receiptConfig?: ReceiptConfig;
  hardwareConfig?: HardwareConfig;
  financeConfig?: FinanceConfig;
  createdAt?: string;
}

export interface BalanceSummary {
  dateRange: { start: string; end: string };
  openingCash: number;
  openingSavings: number;
  totalIncome: number;
  totalExpense: number;
  cashIncome: number;
  cashExpense: number;
  savingsIncome: number;
  savingsExpense: number;
  cashBalance: number;
  savingsBalance: number;
  totalBalance: number;
}

export interface ReceiptConfig {
  header?: string;
  footer?: string;
  logoUrl?: string;
}

export interface HardwareConfig {
  printerType?: "none" | "lan" | "usb";
  ip?: string;
  port?: number;
  bridgeUrl?: string;
  drawerType?: "none" | "rj11" | "rj12";
  drawerPin?: "pin2" | "pin5";
  drawerCommand?: string;
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

export type CashCountStatus = "balanced" | "short" | "overage";

export interface CashCount {
  id: string;
  organizationId?: string;
  countedBy: string;
  countDate: string;
  openingBalance: number;
  expectedBalance: number;
  actualBalance: number;
  variance: number;
  status: CashCountStatus;
  note?: string;
  createdAt?: string;
}

export interface DashboardSummary {
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  netProfit: number;
  transactionCount: number;
  expectedCashBalance?: number;
}

export type AuditLogAction = "create" | "update" | "void";

export type AuditLogEntityType = "transaction" | "category";

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  entityType: AuditLogEntityType;
  entityId: string;
  transactionType?: TransactionType;
  entityTitle?: string;
  action: AuditLogAction;
  reason: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt: string;
  /** ชื่อผู้ทำ — enrich จาก API */
  userName?: string;
}
