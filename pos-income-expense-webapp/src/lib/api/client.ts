import type { KioskSession } from "@/constants/kioskUsers";
import { KIOSK_SESSION_KEY } from "@/constants/kioskUsers";
import type {
  AuditLog,
  AuditLogAction,
  BalanceSummary,
  CashCount,
  CashDeposit,
  CashWithdrawal,
  CashWithdrawalsTodaySummary,
  DailyLedgerSummary,
  Category,
  DashboardSummary,
  Organization,
  ReportSummary,
  Transaction,
} from "@/types";

export const CASH_COUNT_PAGE_CACHE_KEY = "pos-cash-count-page-v1";
export const DASHBOARD_REFRESH_EVENT = "pos-dashboard-refresh";

export function notifyDashboardRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT));
}

export function invalidateCashCountPageCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CASH_COUNT_PAGE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  type: "income" | "expense";
  total: number;
  count: number;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const json = JSON.parse(text) as { error?: { message?: string | object } };
      const msg = json.error?.message;
      if (typeof msg === "string" && msg.trim()) throw new Error(msg);
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith("{")) throw e;
    }
    throw new Error(text.trim() || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function kioskAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return {};
    const session = JSON.parse(raw) as KioskSession;
    return { "X-Kiosk-Role": session.role };
  } catch {
    return {};
  }
}

function jsonAuthHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...kioskAuthHeaders() };
}

export async function fetchTransactions(type?: "income" | "expense"): Promise<Transaction[]> {
  const params = new URLSearchParams({ status: "active" });
  if (type) params.set("type", type);
  const { data } = await parseJson<{ data: Transaction[] }>(
    await fetch(`/api/transactions?${params}`)
  );
  return data;
}

export async function fetchCategories(type?: "income" | "expense"): Promise<Category[]> {
  const qs = type ? `?type=${type}` : "";
  const { data } = await parseJson<{ data: Category[] }>(
    await fetch(`/api/categories${qs}`, { cache: "no-store" })
  );
  return data;
}

export async function fetchBalanceSummary(
  start?: string,
  end?: string
): Promise<BalanceSummary> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString() ? `?${params}` : "";
  const { data } = await parseJson<{ data: BalanceSummary }>(
    await fetch(`/api/reports/balance-summary${qs}`)
  );
  return data;
}

export async function fetchReportSummary(start?: string, end?: string): Promise<ReportSummary> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString() ? `?${params}` : "";
  const { data } = await parseJson<{ data: ReportSummary }>(await fetch(`/api/reports/summary${qs}`));
  return data;
}

export async function fetchByCategoryReport(
  start?: string,
  end?: string
): Promise<CategoryReportItem[]> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString() ? `?${params}` : "";
  const { data } = await parseJson<{ data: CategoryReportItem[] }>(
    await fetch(`/api/reports/by-category${qs}`)
  );
  return data;
}

export async function downloadReportCsv(start: string, end: string): Promise<void> {
  const res = await fetch(`/api/reports/export?start=${start}&end=${end}`);
  if (!res.ok) throw new Error("ส่งออก CSV ไม่สำเร็จ");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${start}_${end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchOrganization(): Promise<Organization> {
  const { data } = await parseJson<{ data: Organization }>(
    await fetch("/api/organizations", { cache: "no-store" })
  );
  return data;
}

export async function updateOrganizationApi(
  body: Partial<
    Pick<
      Organization,
      "name" | "taxId" | "address" | "phone" | "receiptConfig" | "hardwareConfig" | "financeConfig"
    >
  >
): Promise<Organization> {
  const { data } = await parseJson<{ data: Organization }>(
    await fetch("/api/organizations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  );
  return data;
}

export async function loginApi(username: string, pin: string): Promise<KioskSession> {
  const { data } = await parseJson<{ data: KioskSession }>(
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    })
  );
  return data;
}

/** sync user ใน DB + ดึง session ล่าสุด — เรียกหลัง verify PIN ฝั่ง client แล้ว */
export async function syncKioskSessionApi(username: string): Promise<KioskSession> {
  const { data } = await parseJson<{ data: KioskSession }>(
    await fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
  );
  return data;
}

export async function createTransactionApi(
  body: Record<string, unknown>
): Promise<Transaction> {
  const { data } = await parseJson<{ data: Transaction }>(
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return data;
}

export async function updateTransactionApi(
  id: string,
  body: Record<string, unknown>
): Promise<Transaction> {
  const { data } = await parseJson<{ data: Transaction }>(
    await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return data;
}

export async function voidTransactionApi(
  id: string,
  voidReason: string,
  voidedBy?: string
): Promise<Transaction> {
  const { data } = await parseJson<{ data: Transaction }>(
    await fetch(`/api/transactions/${id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voidReason, voidedBy }),
    })
  );
  return data;
}

export async function deleteTransactionApi(id: string): Promise<void> {
  await parseJson<{ data: { success: boolean } }>(
    await fetch(`/api/transactions/${id}`, { method: "DELETE" })
  );
}

export async function createCategoryApi(body: {
  name: string;
  type: "income" | "expense";
  color: string;
}): Promise<Category> {
  const { data } = await parseJson<{ data: Category }>(
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return data;
}

export async function updateCategoryApi(
  id: string,
  body: {
    name?: string;
    type?: "income" | "expense";
    color?: string;
  }
): Promise<Category> {
  const { data } = await parseJson<{ data: Category }>(
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return data;
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await parseJson<{ data: { success: boolean } }>(
    await fetch(`/api/categories/${id}`, { method: "DELETE" })
  );
}

export async function fetchCashCounts(limit = 60): Promise<CashCount[]> {
  const { data } = await parseJson<{ data: CashCount[] }>(
    await fetch(`/api/cash-counts?limit=${limit}`)
  );
  return data;
}

export type CashCountPageData = {
  businessToday: string;
  today: {
    data: CashCount | null;
    expectedBalance: number;
    openingBalance: number;
    countDate: string;
    isLocked: boolean;
  };
  ledger: DailyLedgerSummary;
  withdrawals: {
    data: CashWithdrawal[];
    totalWithdrawn: number;
    count: number;
  };
  history: CashCount[];
};

/** โหลดหน้าปิดยอดครั้งเดียว (สรุป 2 กระเป๋า + นับเงิน + ถอน + ประวัติ) */
export async function fetchCashCountPageData(): Promise<CashCountPageData> {
  return parseJson(await fetch("/api/cash-count/page-data", { cache: "no-store" }));
}

export async function fetchCashCountByDate(date: string): Promise<CashCount | null> {
  const { data } = await parseJson<{ data: CashCount | null }>(
    await fetch(`/api/cash-counts?date=${encodeURIComponent(date)}`)
  );
  return data;
}

export async function fetchDashboard(): Promise<DashboardSummary & { expectedCashBalance: number }> {
  const { data } = await parseJson<{ data: DashboardSummary & { expectedCashBalance: number } }>(
    await fetch("/api/reports/dashboard")
  );
  return data;
}

export async function fetchCashCountToday(): Promise<{
  data: CashCount | null;
  expectedBalance: number;
  openingBalance: number;
  countDate: string;
  businessToday?: string;
  isLocked?: boolean;
}> {
  return parseJson(await fetch("/api/cash-counts/today"));
}

export async function saveCashCountApi(body: {
  countDate: string;
  openingBalance: number;
  actualBalance: number;
  note?: string;
  countedBy?: string;
}): Promise<CashCount> {
  const { data } = await parseJson<{ data: CashCount }>(
    await fetch("/api/cash-counts", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(body),
    })
  );
  return data;
}

export async function updateCashCountApi(
  id: string,
  body: {
    openingBalance?: number;
    actualBalance?: number;
    note?: string;
    updatedBy?: string;
  }
): Promise<CashCount> {
  const { data } = await parseJson<{ data: CashCount }>(
    await fetch(`/api/cash-counts/${id}`, {
      method: "PUT",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(body),
    })
  );
  return data;
}

export async function fetchDailyCloseToday(): Promise<DailyLedgerSummary> {
  const { data } = await parseJson<{ data: DailyLedgerSummary }>(
    await fetch("/api/daily-close/today")
  );
  return data;
}

export async function fetchDailyCloseByDate(date: string): Promise<DailyLedgerSummary> {
  const { data } = await parseJson<{ data: DailyLedgerSummary }>(
    await fetch(`/api/daily-close/${date}`)
  );
  return data;
}

export async function fetchCashWithdrawalsToday(): Promise<CashWithdrawalsTodaySummary> {
  return parseJson(await fetch("/api/cash-withdrawals/today"));
}

export async function fetchCashWithdrawals(filters?: {
  startDate?: string;
  endDate?: string;
  withdrawalDate?: string;
}): Promise<{ data: CashWithdrawal[]; totalWithdrawn: number }> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.withdrawalDate) params.set("withdrawalDate", filters.withdrawalDate);
  const qs = params.toString() ? `?${params}` : "";
  const { data, totalWithdrawn } = await parseJson<{
    data: CashWithdrawal[];
    totalWithdrawn: number;
  }>(await fetch(`/api/cash-withdrawals${qs}`));
  return { data, totalWithdrawn };
}

export async function createCashWithdrawalApi(body: {
  amount: number;
  note?: string;
  recordedBy?: string;
  withdrawalDate?: string;
}): Promise<CashWithdrawal> {
  const { data } = await parseJson<{ data: CashWithdrawal }>(
    await fetch("/api/cash-withdrawals", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(body),
    })
  );
  invalidateCashCountPageCache();
  notifyDashboardRefresh();
  return data;
}

export async function fetchCashDeposits(filters?: {
  startDate?: string;
  endDate?: string;
  depositDate?: string;
}): Promise<{ data: CashDeposit[]; totalDeposited: number }> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.depositDate) params.set("depositDate", filters.depositDate);
  const qs = params.toString() ? `?${params}` : "";
  const { data, totalDeposited } = await parseJson<{
    data: CashDeposit[];
    totalDeposited: number;
  }>(await fetch(`/api/cash-deposits${qs}`));
  return { data, totalDeposited };
}

export async function createCashDepositApi(body: {
  amount: number;
  recordedBy?: string;
  depositDate?: string;
}): Promise<CashDeposit> {
  const { data } = await parseJson<{ data: CashDeposit }>(
    await fetch("/api/cash-deposits", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(body),
    })
  );
  invalidateCashCountPageCache();
  notifyDashboardRefresh();
  return data;
}

export async function clearDrawerAndCloseDayApi(body?: {
  actualBalance?: number;
  note?: string;
  recordedBy?: string;
  updatedBy?: string;
}): Promise<{
  cashCount: CashCount;
  withdrawal: CashWithdrawal | null;
  ledger: DailyLedgerSummary;
  message: string;
}> {
  const { data } = await parseJson<{
    data: {
      cashCount: CashCount;
      withdrawal: CashWithdrawal | null;
      ledger: DailyLedgerSummary;
      message: string;
    };
  }>(
    await fetch("/api/cash-counts/today/clear-drawer", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(body ?? {}),
    })
  );
  invalidateCashCountPageCache();
  notifyDashboardRefresh();
  return data;
}

export async function fetchAuditLogs(filters?: {
  startDate?: string;
  endDate?: string;
  action?: AuditLogAction;
  transactionType?: "income" | "expense";
}): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.transactionType) params.set("transactionType", filters.transactionType);
  const qs = params.toString() ? `?${params}` : "";
  const { data } = await parseJson<{ data: AuditLog[] }>(
    await fetch(`/api/audit-logs${qs}`)
  );
  return data;
}
