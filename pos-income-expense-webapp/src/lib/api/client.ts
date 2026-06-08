import type { KioskSession } from "@/constants/kioskUsers";
import type {
  AuditLog,
  AuditLogAction,
  BalanceSummary,
  CashCount,
  Category,
  DashboardSummary,
  Organization,
  ReportSummary,
  Transaction,
} from "@/types";

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
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
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
  const { data } = await parseJson<{ data: Category[] }>(await fetch(`/api/categories${qs}`));
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
  const { data } = await parseJson<{ data: Organization }>(await fetch("/api/organizations"));
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

export async function fetchCashCounts(): Promise<CashCount[]> {
  const { data } = await parseJson<{ data: CashCount[] }>(await fetch("/api/cash-counts"));
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
}> {
  return parseJson(await fetch("/api/cash-counts/today"));
}

export async function saveCashCountApi(body: {
  countDate: string;
  openingBalance: number;
  actualBalance: number;
  note?: string;
}): Promise<CashCount> {
  const { data } = await parseJson<{ data: CashCount }>(
    await fetch("/api/cash-counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  }
): Promise<CashCount> {
  const { data } = await parseJson<{ data: CashCount }>(
    await fetch(`/api/cash-counts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
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
