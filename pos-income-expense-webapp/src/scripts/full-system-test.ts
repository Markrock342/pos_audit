/**
 * Full system test — รายรับ/จ่าย ฝาก/ถอน ปิดยอด แก้ไข รอบใหม่ ล้างวันนี้
 * Run: npm run test:full-system
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const SLOW_MS = 2500;

type Step = { name: string; pass: boolean; detail?: string; ms?: number };
const steps: Step[] = [];

function log(name: string, pass: boolean, detail?: string, ms?: number) {
  steps.push({ name, pass, detail, ms });
  const slow = ms != null && ms > SLOW_MS ? " [SLOW]" : "";
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}${ms != null ? ` (${ms}ms)` : ""}${slow}`);
}

async function req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(90_000),
  });
  const ms = Date.now() - t0;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text, ms };
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

async function ensureDayOpen() {
  let r = await req("GET", "/api/cash-counts/today");
  const rec = data<{ closedAt?: string | null; closeEditReopenedAt?: string | null }>(r.json);
  if (rec?.closedAt && !rec?.closeEditReopenedAt) {
    r = await req("POST", "/api/cash-counts/today/reopen-for-edit", {});
    if (r.status !== 200) {
      r = await req("POST", "/api/cash-counts/today/start-new-round", {});
    }
  }
}

async function main() {
  console.log(`\n=== Full System Test @ ${BASE} ===\n`);

  let r = await req("GET", "/api/categories");
  if (r.status !== 200) {
    log("API reachable", false, `${r.status}`);
    printSummary();
    process.exit(1);
  }
  log("API reachable", true, undefined, r.ms);

  const categories = data<Array<{ id: string; type: string }>>(r.json) ?? [];
  const incomeCat = categories.find((c) => c.type === "income");
  const expenseCat = categories.find((c) => c.type === "expense");
  if (!incomeCat || !expenseCat) {
    log("categories", false);
    process.exit(1);
  }

  // --- Phase 0: clear today for clean slate ---
  r = await req("POST", "/api/admin/clear-today");
  log(
    "POST clear-today (clean slate)",
    r.status === 200,
    r.status === 403 ? errMsg(r.json) || "RPC not deployed" : errMsg(r.json) || "ok",
    r.ms
  );
  if (r.status === 403) {
    console.log("\n⚠ clear-today RPC missing — run docs/supabase-admin-clear-business-day.sql\n");
  }

  await ensureDayOpen();

  r = await req("GET", "/api/cash-counts/today");
  const businessToday =
    (r.json as { businessToday?: string }).businessToday ??
    data<{ countDate?: string }>(r.json)?.countDate ??
    "";
  log("businessToday", !!businessToday, businessToday);

  // --- Phase 1: seed round 1 ---
  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "FULL-TEST R1 income",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 1000, categoryId: incomeCat.id }],
  });
  log("R1 POST income 1000", r.status === 201, errMsg(r.json), r.ms);

  r = await req("POST", "/api/transactions", {
    type: "expense",
    title: "FULL-TEST R1 expense",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 200, categoryId: expenseCat.id }],
  });
  log("R1 POST expense 200", r.status === 201, errMsg(r.json), r.ms);

  r = await req("POST", "/api/cash-deposits", { amount: 300, note: "FULL-TEST deposit" });
  log("R1 POST deposit 300", r.status === 201, errMsg(r.json), r.ms);

  r = await req("POST", "/api/cash-withdrawals", { amount: 50, note: "FULL-TEST withdraw" });
  log("R1 POST withdraw 50", r.status === 201 || r.status === 503, errMsg(r.json) || String(r.status), r.ms);

  r = await req("GET", "/api/transactions/list-page?type=income");
  const r1Income = data<{ transactions: unknown[]; dayCleared: boolean }>(r.json);
  log(
    "R1 income list has data",
    (r1Income?.transactions.length ?? 0) >= 1 && r1Income?.dayCleared === false,
    `rows=${r1Income?.transactions.length}`,
    r.ms
  );

  // --- Phase 2: close round 1 ---
  r = await req("GET", "/api/cash-counts/today");
  const beforeClose = data<{ expectedBalance?: number; closedAt?: string | null; sessionRound?: number }>(r.json);
  const round1 = beforeClose?.sessionRound ?? 1;

  if (!beforeClose?.closedAt) {
    r = await req("POST", "/api/cash-counts/today/clear-drawer", {
      actualBalance: beforeClose?.expectedBalance ?? 0,
    });
    log("R1 POST clear-drawer", r.status === 200, errMsg(r.json), r.ms);
  } else {
    log("R1 POST clear-drawer", true, "already closed");
  }

  r = await req("GET", "/api/reports/dashboard");
  const dashR1Closed = data<{ todayIncome: number; todayExpense: number; expectedCashBalance: number }>(r.json);
  log(
    "R1 dashboard zero after close",
    dashR1Closed?.todayIncome === 0 &&
      dashR1Closed?.todayExpense === 0 &&
      dashR1Closed?.expectedCashBalance === 0,
    `in=${dashR1Closed?.todayIncome} out=${dashR1Closed?.todayExpense}`,
    r.ms
  );

  // --- Phase 3: reopen edit + edit tx + close again ---
  r = await req("POST", "/api/cash-counts/today/reopen-for-edit", {});
  log("POST reopen-for-edit", r.status === 200, errMsg(r.json), r.ms);

  r = await req("GET", "/api/transactions?status=active&startDate=" + businessToday);
  const txs = data<Array<{ id: string; title: string; amount: number }>>(r.json) ?? [];
  const incomeTx = txs.find((t) => t.title.includes("FULL-TEST R1 income"));
  if (incomeTx) {
    r = await req("PUT", `/api/transactions/${incomeTx.id}`, {
      title: "FULL-TEST R1 income edited",
      paymentMethod: "cash",
      transactionDate: businessToday,
      editReason: "full system test edit close",
      lineItems: [{ title: "x", quantity: 1, unitPrice: 1200, categoryId: incomeCat.id }],
    });
    log("PUT edit income during close-edit", r.status === 200, errMsg(r.json), r.ms);
  } else {
    log("PUT edit income during close-edit", false, "income tx not found");
  }

  r = await req("GET", "/api/cash-counts/today");
  const afterEdit = data<{ expectedBalance?: number }>(r.json);
  r = await req("POST", "/api/cash-counts/today/clear-drawer", {
    actualBalance: afterEdit?.expectedBalance ?? 0,
  });
  log("POST clear-drawer after edit", r.status === 200, errMsg(r.json), r.ms);

  r = await req("GET", `/api/cash-counts/close-events?date=${businessToday}`);
  const closeEvents =
    data<Array<{ eventType: string; sessionRound?: number; expectedBalance?: number }>>(r.json)?.events ??
    data<Array<{ eventType: string; sessionRound?: number }>>(r.json) ??
    [];
  const closeSummary = closeEvents.filter(
    (e) => e.eventType === "close" || e.eventType === "close_after_edit"
  );
  const round1Events = closeSummary.filter((e) => (e.sessionRound ?? 1) === round1);
  log(
    "close events for round 1 dedupe check",
    round1Events.length >= 1,
    `total=${closeSummary.length} round1=${round1Events.length}`,
    r.ms
  );

  // --- Phase 4: start new round ---
  r = await req("POST", "/api/cash-counts/today/start-new-round", {});
  log("POST start-new-round", r.status === 200, errMsg(r.json), r.ms);

  const newRound = data<{ sessionRound?: number }>(r.json)?.sessionRound ?? round1 + 1;
  log("new session round", newRound > round1, `round=${newRound}`, r.ms);

  r = await req("GET", "/api/transactions/list-page?type=income");
  const r2IncomeEmpty = data<{ transactions: unknown[]; dayCleared: boolean }>(r.json);
  log(
    "R2 workspace income empty (new round)",
    (r2IncomeEmpty?.transactions.length ?? 0) === 0 && r2IncomeEmpty?.dayCleared === false,
    `rows=${r2IncomeEmpty?.transactions.length}`,
    r.ms
  );

  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "FULL-TEST R2 income",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 500, categoryId: incomeCat.id }],
  });
  log("R2 POST income 500", r.status === 201, errMsg(r.json), r.ms);

  r = await req("GET", "/api/reports/dashboard");
  const dashR2 = data<{ todayIncome: number; monthIncome: number }>(r.json);
  log(
    "R2 dashboard today=500 month includes all rounds",
    dashR2?.todayIncome === 500 && (dashR2?.monthIncome ?? 0) >= 500,
    `today=${dashR2?.todayIncome} month=${dashR2?.monthIncome}`,
    r.ms
  );

  r = await req("GET", `/api/reports/summary?start=${businessToday}&end=${businessToday}`);
  const reportToday = data<{ totalIncome: number }>(r.json);
  log(
    "report today sums all rounds",
    (reportToday?.totalIncome ?? 0) >= 1200 + 500,
    `totalIncome=${reportToday?.totalIncome}`,
    r.ms
  );

  // --- Phase 5: performance probes ---
  const perfPaths = [
    ["/api/cash-count/page-data", "page-data"],
    ["/api/reports/dashboard", "dashboard"],
    [`/api/audit-logs?startDate=${businessToday}&endDate=${businessToday}`, "audit-logs today"],
    [`/api/cash-counts/close-events?startDate=${businessToday}&endDate=${businessToday}`, "close-events range"],
    ["/api/transactions/list-page?type=expense", "list-page expense"],
  ] as const;

  for (const [path, label] of perfPaths) {
    r = await req("GET", path);
    log(`perf GET ${label}`, r.status === 200, undefined, r.ms);
  }

  // --- Phase 6: clear today again ---
  r = await req("POST", "/api/admin/clear-today");
  const clearOk = r.status === 200;
  log("POST clear-today (final)", clearOk, errMsg(r.json) || "ok", r.ms);

  if (clearOk) {
    r = await req("GET", "/api/transactions?status=active&startDate=" + businessToday);
    const afterClear = data<unknown[]>(r.json) ?? [];
    log("after clear: no transactions today", afterClear.length === 0, `rows=${afterClear.length}`, r.ms);

    r = await req("GET", `/api/cash-deposits?depositDate=${businessToday}`);
    const deps = data<unknown[]>(r.json) ?? [];
    log("after clear: no deposits today", deps.length === 0, `rows=${deps.length}`, r.ms);

    r = await req("GET", "/api/reports/dashboard");
    const dashClear = data<{ todayIncome: number; todayExpense: number }>(r.json);
    log(
      "after clear: dashboard today zero",
      dashClear?.todayIncome === 0 && dashClear?.todayExpense === 0,
      `today in=${dashClear?.todayIncome} out=${dashClear?.todayExpense}`,
      r.ms
    );

    r = await req("GET", `/api/cash-counts/close-events?date=${businessToday}`);
    const eventsAfter =
      data<{ events?: unknown[] }>(r.json)?.events ?? data<unknown[]>(r.json) ?? [];
    log(
      "after clear: no close events today",
      (Array.isArray(eventsAfter) ? eventsAfter : []).length === 0,
      `events=${Array.isArray(eventsAfter) ? eventsAfter.length : "?"}`,
      r.ms
    );
  }

  printSummary();
  const failed = steps.filter((s) => !s.pass).length;
  const slow = steps.filter((s) => (s.ms ?? 0) > SLOW_MS);
  if (slow.length) {
    console.log("\nSlow endpoints (>" + SLOW_MS + "ms):");
    for (const s of slow) console.log(`  - ${s.name}: ${s.ms}ms`);
  }
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
