/**
 * Close → clear → reopen edit → restore → close again
 * Run: npx tsx src/scripts/close-edit-cycle-test.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

type Step = { name: string; pass: boolean; detail?: string };
const steps: Step[] = [];

function log(name: string, pass: boolean, detail?: string) {
  steps.push({ name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function data<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) return (json as { data: T }).data;
  return null;
}

function errMsg(json: unknown): string {
  if (json && typeof json === "object" && "error" in json) {
    const e = (json as { error: { message?: string } }).error;
    return typeof e?.message === "string" ? e.message : JSON.stringify(e);
  }
  return "";
}

async function main() {
  console.log(`\n=== Close/Edit Cycle Test @ ${BASE} ===\n`);

  let r = await req("GET", "/api/categories");
  if (r.status !== 200) {
    log("API reachable", false, `categories ${r.status} ${r.text.slice(0, 80)}`);
    printSummary();
    process.exit(1);
  }
  log("API reachable", true);

  const categories = data<Array<{ id: string; type: string }>>(r.json) ?? [];
  const incomeCat = categories.find((c) => c.type === "income");
  const expenseCat = categories.find((c) => c.type === "expense");
  if (!incomeCat || !expenseCat) {
    log("categories exist", false);
    process.exit(1);
  }

  r = await req("GET", "/api/cash-counts/today");
  const todayPayload = r.json as { businessToday?: string; data?: { id?: string; closedAt?: string | null; closeEditReopenedAt?: string | null } };
  const businessToday = todayPayload.businessToday ?? "";
  log("got businessToday", !!businessToday, businessToday);

  if (todayPayload.data?.closedAt && !todayPayload.data?.closeEditReopenedAt) {
    r = await req("POST", "/api/cash-counts/today/reopen-for-edit", {});
    log("reopen before seed (day was closed)", r.status === 200, errMsg(r.json));
  }

  // Seed movements
  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "CYCLE-TEST income",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 500, categoryId: incomeCat.id }],
  });
  log("POST income 500", r.status === 201, errMsg(r.json));

  r = await req("POST", "/api/transactions", {
    type: "expense",
    title: "CYCLE-TEST expense",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 100, categoryId: expenseCat.id }],
  });
  log("POST expense 100", r.status === 201, errMsg(r.json));

  r = await req("POST", "/api/cash-deposits", { amount: 200, note: "CYCLE-TEST deposit" });
  log("POST deposit 200", r.status === 201, errMsg(r.json));

  r = await req("POST", "/api/cash-withdrawals", { amount: 50, note: "CYCLE-TEST withdraw" });
  log("POST withdraw 50", r.status === 201 || r.status === 503, errMsg(r.json) || String(r.status));

  // Before close — data visible
  r = await req("GET", "/api/transactions/list-page?type=income");
  const incomeBefore = data<{ transactions: Array<{ amount: number }>; dayCleared: boolean }>(r.json);
  log(
    "income list before close (not cleared)",
    r.status === 200 && incomeBefore?.dayCleared === false && (incomeBefore?.transactions.length ?? 0) > 0,
    `cleared=${incomeBefore?.dayCleared} rows=${incomeBefore?.transactions.length}`
  );

  r = await req("GET", `/api/cash-deposits?depositDate=${businessToday}`);
  const depBefore = data<Array<{ amount: number }>>(r.json) ?? [];
  log("deposits before close", depBefore.length > 0, `rows=${depBefore.length}`);

  r = await req("GET", "/api/reports/dashboard");
  const dashBefore = data<{
    todayIncome: number;
    todayExpense: number;
    dailyCloseStatus: { closedAt?: string | null; inCloseEditMode?: boolean };
  }>(r.json);
  log(
    "dashboard before close shows income",
    (dashBefore?.todayIncome ?? 0) > 0,
    `income=${dashBefore?.todayIncome} expense=${dashBefore?.todayExpense}`
  );

  // Close
  r = await req("GET", "/api/cash-counts/today");
  const todayRec = data<{ id?: string; expectedBalance?: number; closedAt?: string | null }>(r.json);
  if (!todayRec?.closedAt) {
    r = await req("POST", "/api/cash-counts/today/clear-drawer", {
      actualBalance: todayRec?.expectedBalance ?? 0,
    });
    log("POST clear-drawer (close)", r.status === 200, errMsg(r.json));
  } else {
    log("POST clear-drawer (close)", true, "already closed");
  }

  // After close — cleared
  r = await req("GET", "/api/reports/dashboard");
  const dashClosed = data<{ todayIncome: number; todayExpense: number; expectedCashBalance: number }>(r.json);
  log(
    "dashboard after close = 0",
    dashClosed?.todayIncome === 0 && dashClosed?.todayExpense === 0 && dashClosed?.expectedCashBalance === 0,
    `income=${dashClosed?.todayIncome} expense=${dashClosed?.todayExpense} cash=${dashClosed?.expectedCashBalance}`
  );

  r = await req("GET", "/api/transactions/list-page?type=income");
  const incomeClosed = data<{ transactions: unknown[]; dayCleared: boolean }>(r.json);
  log(
    "income list cleared after close",
    incomeClosed?.dayCleared === true && (incomeClosed?.transactions.length ?? 0) === 0,
    `cleared=${incomeClosed?.dayCleared} rows=${incomeClosed?.transactions.length}`
  );

  r = await req("GET", "/api/transactions/list-page?type=expense");
  const expenseClosed = data<{ transactions: unknown[]; dayCleared: boolean }>(r.json);
  log(
    "expense list cleared after close",
    expenseClosed?.dayCleared === true && (expenseClosed?.transactions.length ?? 0) === 0,
    `cleared=${expenseClosed?.dayCleared} rows=${expenseClosed?.transactions.length}`
  );

  r = await req("GET", "/api/cash-count/page-data");
  const pageClosed = r.json as {
    businessToday?: string;
    today?: { data?: { closedAt?: string | null; closeEditReopenedAt?: string | null; countDate?: string }; isLocked?: boolean };
  };
  const recClosed = pageClosed.today?.data;
  const workspaceCleared =
    !!recClosed?.closedAt &&
    !recClosed?.closeEditReopenedAt &&
    recClosed.countDate === pageClosed.businessToday;
  log("cash-count workspace cleared after close", workspaceCleared, `closedAt=${recClosed?.closedAt ?? "null"}`);

  r = await req("GET", `/api/cash-deposits?depositDate=${businessToday}`);
  const depClosed = data<Array<{ amount: number }>>(r.json) ?? [];
  log(
    "movement UI would hide deposits when cleared",
    workspaceCleared,
    `api still has ${depClosed.length} rows (hidden in UI)`
  );

  // Reopen for edit
  r = await req("POST", "/api/cash-counts/today/reopen-for-edit", {});
  log("POST reopen-for-edit", r.status === 200, errMsg(r.json));

  r = await req("GET", "/api/transactions/list-page?type=income");
  const incomeReopen = data<{ transactions: Array<{ amount: number }>; dayCleared: boolean }>(r.json);
  const incomeTotal = (incomeReopen?.transactions ?? []).reduce((s, t) => s + t.amount, 0);
  log(
    "income restored after reopen",
    incomeReopen?.dayCleared === false && incomeTotal >= 500,
    `cleared=${incomeReopen?.dayCleared} total=${incomeTotal}`
  );

  r = await req("GET", "/api/reports/dashboard");
  const dashReopen = data<{ todayIncome: number; todayExpense: number }>(r.json);
  log(
    "dashboard restored after reopen",
    (dashReopen?.todayIncome ?? 0) >= 500 && (dashReopen?.todayExpense ?? 0) >= 100,
    `income=${dashReopen?.todayIncome} expense=${dashReopen?.todayExpense}`
  );

  r = await req("GET", "/api/cash-count/page-data");
  const pageReopen = r.json as {
    businessToday?: string;
    today?: { data?: { closedAt?: string | null; closeEditReopenedAt?: string | null; countDate?: string } };
  };
  const recReopen = pageReopen.today?.data;
  const workspaceOpen =
    !recReopen?.closedAt && !!recReopen?.closeEditReopenedAt && recReopen.countDate === pageReopen.businessToday;
  log("cash-count workspace open for edit", workspaceOpen, `reopenedAt=${recReopen?.closeEditReopenedAt ?? "null"}`);

  // Close again
  r = await req("GET", "/api/cash-counts/today");
  const todayReopen = data<{ expectedBalance?: number; closedAt?: string | null }>(r.json);
  r = await req("POST", "/api/cash-counts/today/clear-drawer", {
    actualBalance: todayReopen?.expectedBalance ?? 0,
  });
  log("POST clear-drawer again", r.status === 200, errMsg(r.json));

  r = await req("GET", "/api/reports/dashboard");
  const dashClosed2 = data<{ todayIncome: number; todayExpense: number }>(r.json);
  log(
    "dashboard zero after 2nd close",
    dashClosed2?.todayIncome === 0 && dashClosed2?.todayExpense === 0,
    `income=${dashClosed2?.todayIncome} expense=${dashClosed2?.todayExpense}`
  );

  printSummary();
  const failed = steps.filter((s) => !s.pass).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const failed = steps.filter((s) => !s.pass);
  console.log(`\n=== ${steps.length - failed.length}/${steps.length} passed ===`);
  if (failed.length) {
    console.log("Failed:");
    for (const s of failed) console.log(`  - ${s.name}${s.detail ? `: ${s.detail}` : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
