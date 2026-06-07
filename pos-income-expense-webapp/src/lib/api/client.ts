import type { Category, ReportSummary, Transaction } from "@/types";
import { getClientDataSource } from "@/lib/dataSource";
import { mockCategories, mockTransactions } from "@/data/mock";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchTransactions(type?: "income" | "expense"): Promise<Transaction[]> {
  if (getClientDataSource() === "mock") {
    const data = mockTransactions.filter((t) => t.status === "active");
    return type ? data.filter((t) => t.type === type) : data;
  }
  const qs = type ? `?type=${type}` : "";
  const { data } = await parseJson<{ data: Transaction[] }>(await fetch(`/api/transactions${qs}`));
  return data;
}

export async function fetchCategories(type?: "income" | "expense"): Promise<Category[]> {
  if (getClientDataSource() === "mock") {
    return type ? mockCategories.filter((c) => c.type === type) : mockCategories;
  }
  const qs = type ? `?type=${type}` : "";
  const { data } = await parseJson<{ data: Category[] }>(await fetch(`/api/categories${qs}`));
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

export async function createTransactionApi(
  body: Record<string, unknown>
): Promise<Transaction> {
  if (getClientDataSource() === "mock") {
    throw new Error("โหมด Mock — บันทึกลง Supabase ไม่ได้ สลับกลับเป็น Supabase ก่อน");
  }
  const { data } = await parseJson<{ data: Transaction }>(
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return data;
}
