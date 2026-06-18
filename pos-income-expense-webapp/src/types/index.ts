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

export interface TransactionLineItem {
  id: string;
  transactionId: string;
  sortOrder: number;
  title: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  categoryId: string;
}

export interface Transaction {
  id: string;
  organizationId?: string;
  type: TransactionType;
  /** หมวดหลัก (บรรทัดแรก) — ใช้ fallback รายงานเก่า */
  categoryId: string;
  /** ชื่อหัวใบ — ผู้ใช้ตั้งเอง เช่น "ขายให้คุณสมชาย" */
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
  /** รายการย่อย — โหลดจาก API */
  lineItems?: TransactionLineItem[];
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
  printerType?: "none" | "lan" | "usb" | "imin";
  /** ชนิดการเชื่อมต่อเครื่องพิมพ์ในตัว iMin — ส่วนใหญ่ iMin 80 ใช้ USB */
  iminConnectType?: "USB" | "SPI" | "Bluetooth";
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

/** ถอนเงินสดออกจาก POS — ไม่ใช่รายจ่ายธุรกิจ */
export interface CashWithdrawal {
  id: string;
  organizationId?: string;
  withdrawalDate: string;
  amount: number;
  note: string;
  recordedBy?: string;
  createdAt?: string;
}

export interface CashWithdrawalsTodaySummary {
  businessToday: string;
  totalWithdrawn: number;
  count: number;
  data: CashWithdrawal[];
}

/** ฝากเงินสดเข้า POS — ไม่ใช่รายรับธุรกิจ */
export interface CashDeposit {
  id: string;
  organizationId?: string;
  depositDate: string;
  amount: number;
  recordedBy?: string;
  createdAt?: string;
}

export interface DailyLedgerWallet {
  opening: number;
  income: number;
  expense: number;
  closing: number;
}

export interface DailyLedgerCashWallet extends DailyLedgerWallet {
  withdrawn: number;
  deposited: number;
}

export interface DailyLedgerSummary {
  countDate: string;
  businessToday: string;
  isLocked: boolean;
  closedAt?: string;
  closingType?: "manual" | "auto";
  autoClosed?: boolean;
  cash: DailyLedgerCashWallet;
  transfer: DailyLedgerWallet;
  business: {
    totalIncome: number;
    totalExpense: number;
    netTotal: number;
  };
}

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
  closedAt?: string;
  autoClosed?: boolean;
  closingType?: "manual" | "auto";
  hasManualCount?: boolean;
  updatedAt?: string;
  updatedBy?: string;
  /** Phase 3 — snapshot สด + โอน + สรุปธุรกิจ */
  openingTransfer?: number;
  cashIncome?: number;
  cashExpense?: number;
  cashWithdrawn?: number;
  closingCash?: number;
  transferIncome?: number;
  transferExpense?: number;
  closingTransfer?: number;
  totalIncome?: number;
  totalExpense?: number;
  netTotal?: number;
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

/** สถานะปิดยอดวันนี้ — แสดงบน dashboard */
export interface DailyCloseStatus {
  countDate: string;
  isLocked: boolean;
  closedAt?: string;
  autoClosed?: boolean;
  hasManualCount: boolean;
  cashClosing: number;
  transferClosing: number;
  netTotal: number;
}

export type AuditLogAction = "create" | "update" | "void";

export type AuditLogEntityType =
  | "transaction"
  | "category"
  | "cash_deposit"
  | "cash_withdrawal";

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
