/**
 * Integration smoke test — รัน: npx tsx src/scripts/integration-test.ts
 * ทดสอบ API รายรับ/รายจ่าย/ปิดยอด ~30 กรณี
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { ORG_IDS } from "../constants/organizations";
import { createAnonClient, createServiceRoleClient } from "./supabaseAdmin";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

type Result = {
  id: number;
  name: string;
  pass: boolean;
  status?: number;
  detail?: string;
};

const results: Result[] = [];
let testNum = 0;

async function req(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; json: unknown; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

function record(name: string, pass: boolean, status?: number, detail?: string) {
  testNum += 1;
  results.push({ id: testNum, name, pass, status, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`[${mark}] #${testNum} ${name}${status ? ` (${status})` : ""}${detail ? ` — ${detail}` : ""}`);
}

function getData<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return null;
}

function getError(json: unknown): { code?: string; message?: string } | null {
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error: { code?: string; message?: string } }).error;
    return err ?? null;
  }
  return null;
}

/** ลบปิดยอด/ถอนวันนี้ — ให้รันเทสซ้ำได้ */
async function reopenTodayCashCountForTests(countDate: string) {
  if (!countDate) return;
  const orgId = ORG_IDS.customer;
  const admin = createServiceRoleClient();
  if (admin) {
    await admin.from("cash_withdrawals").delete().eq("organization_id", orgId).eq("withdrawal_date", countDate);
    await admin.from("cash_counts").delete().eq("organization_id", orgId).eq("count_date", countDate);
    return;
  }
  const anon = createAnonClient();
  await anon.rpc("fn_admin_clear_daily_close", { p_organization_id: orgId });
}

async function main() {
  console.log(`\n=== Integration Test @ ${BASE} ===\n`);

  let businessToday = "";
  let cashCountId = "";
  const createdTxIds: string[] = [];

  try {
  // --- Setup: health checks ---
  let r = await req("GET", "/api/categories");
  record("GET /api/categories", r.status === 200, r.status);
  const categories = getData<Array<{ id: string; type: string; name: string }>>(r.json) ?? [];
  const incomeCat = categories.find((c) => c.type === "income");
  const expenseCat = categories.find((c) => c.type === "expense");
  record(
    "มี category รายรับและรายจ่าย",
    !!incomeCat && !!expenseCat,
    undefined,
    incomeCat && expenseCat ? `${incomeCat.name} / ${expenseCat.name}` : "missing"
  );

  r = await req("GET", "/api/cash-counts/today");
  record("GET /api/cash-counts/today", r.status === 200, r.status, getError(r.json)?.message);
  const todayPayload = r.json as {
    businessToday?: string;
    data?: { id: string; countDate: string; expectedBalance: number; closedAt?: string | null };
    expectedBalance?: number;
  };
  businessToday = todayPayload.businessToday ?? todayPayload.data?.countDate ?? "";
  record("ได้ businessToday", !!businessToday, undefined, businessToday);
  await reopenTodayCashCountForTests(businessToday);

  r = await req("GET", "/api/reports/dashboard");
  record("GET /api/reports/dashboard", r.status === 200, r.status);

  r = await req("GET", "/api/transactions?status=active");
  record("GET /api/transactions", r.status === 200, r.status);

  if (!incomeCat || !expenseCat || !businessToday) {
    console.log("\nAbort: missing prerequisites");
    printSummary();
    process.exit(1);
  }

  cashCountId = todayPayload.data?.id ?? "";

  // --- Income tests ---
  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "TEST income cash",
    paymentMethod: "cash",
    lineItems: [{ title: "item", quantity: 1, unitPrice: 100, categoryId: incomeCat.id }],
  });
  const incomeTx = getData<{ id: string; amount: number }>(r.json);
  if (incomeTx) createdTxIds.push(incomeTx.id);
  record("POST income (cash 100)", r.status === 201, r.status, incomeTx ? `amount=${incomeTx.amount}` : getError(r.json)?.message);

  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "TEST income transfer",
    paymentMethod: "transfer",
    lineItems: [{ title: "item", quantity: 2, unitPrice: 50, categoryId: incomeCat.id }],
  });
  const incomeTransfer = getData<{ id: string }>(r.json);
  if (incomeTransfer) createdTxIds.push(incomeTransfer.id);
  record("POST income (transfer 100)", r.status === 201, r.status);

  // --- Expense tests ---
  r = await req("POST", "/api/transactions", {
    type: "expense",
    title: "TEST expense cash",
    paymentMethod: "cash",
    lineItems: [{ title: "item", quantity: 1, unitPrice: 30, categoryId: expenseCat.id }],
  });
  const expenseTx = getData<{ id: string }>(r.json);
  if (expenseTx) createdTxIds.push(expenseTx.id);
  record("POST expense (cash 30)", r.status === 201, r.status);

  // --- Multi-line transaction ---
  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "TEST multi-line",
    paymentMethod: "cash",
    lineItems: [
      { title: "a", quantity: 2, unitPrice: 25, categoryId: incomeCat.id },
      { title: "b", quantity: 1, unitPrice: 50, categoryId: incomeCat.id },
    ],
  });
  const multiTx = getData<{ id: string; amount: number; lineItems?: unknown[] }>(r.json);
  if (multiTx) createdTxIds.push(multiTx.id);
  record(
    "POST multi-line income (100)",
    r.status === 201 && multiTx?.amount === 100,
    r.status,
    multiTx ? `amount=${multiTx.amount} lines=${multiTx.lineItems?.length ?? "?"}` : undefined
  );

  // --- Decimal unitPrice rejected ---
  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "TEST decimal",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 10.5, categoryId: incomeCat.id }],
  });
  record("POST decimal unitPrice → 400", r.status === 400, r.status);

  // --- Edit transaction (needs editReason) ---
  if (multiTx) {
    r = await req("PUT", `/api/transactions/${multiTx.id}`, {
      title: "TEST multi-line edited",
      paymentMethod: "cash",
      transactionDate: businessToday,
      editReason: "integration test edit",
      lineItems: [
        { title: "a", quantity: 1, unitPrice: 80, categoryId: incomeCat.id },
      ],
    });
    const edited = getData<{ amount: number }>(r.json);
    record("PUT edit transaction", r.status === 200, r.status, edited ? `amount=${edited.amount}` : getError(r.json)?.message);
  }

  // --- Edit without editReason → 400 ---
  if (multiTx) {
    r = await req("PUT", `/api/transactions/${multiTx.id}`, {
      title: "no reason",
      paymentMethod: "cash",
      transactionDate: businessToday,
      lineItems: [{ title: "x", quantity: 1, unitPrice: 1, categoryId: incomeCat.id }],
    });
    record("PUT without editReason → 400", r.status === 400, r.status);
  }

  // --- GET single transaction ---
  if (multiTx) {
    r = await req("GET", `/api/transactions/${multiTx.id}`);
    record("GET transaction by id", r.status === 200, r.status);
    r = await req("GET", `/api/transactions/00000000-0000-0000-0000-000000000000`);
    record("GET missing transaction → 404", r.status === 404, r.status);
  }

  // --- DELETE hard delete blocked ---
  if (multiTx) {
    r = await req("DELETE", `/api/transactions/${multiTx.id}`);
    record("DELETE transaction → 405", r.status === 405, r.status);
  }

  r = await req("POST", "/api/transactions", { type: "income", title: "", paymentMethod: "cash", lineItems: [] });
  record("POST income invalid (empty) → 400", r.status === 400, r.status);

  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "bad",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 0, unitPrice: 10, categoryId: incomeCat.id }],
  });
  record("POST income qty=0 → 400", r.status === 400, r.status);

  // --- Backdate staff blocked ---
  const yesterday = new Date(businessToday + "T12:00:00Z");
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "TEST backdate staff",
    paymentMethod: "cash",
    transactionDate: yStr,
    lineItems: [{ title: "item", quantity: 1, unitPrice: 1, categoryId: incomeCat.id }],
  });
  record("POST backdate (staff) → 403", r.status === 403, r.status, getError(r.json)?.code);

  // --- Backdate admin allowed ---
  r = await req(
    "POST",
    "/api/transactions",
    {
      type: "expense",
      title: "TEST backdate admin",
      paymentMethod: "cash",
      transactionDate: yStr,
      lineItems: [{ title: "item", quantity: 1, unitPrice: 5, categoryId: expenseCat.id }],
    },
    { "X-Kiosk-Role": "admin" }
  );
  const adminBackTx = getData<{ id: string }>(r.json);
  if (adminBackTx) createdTxIds.push(adminBackTx.id);
  record("POST backdate (admin) → 201 or 403 if day closed", r.status === 201 || r.status === 403, r.status, getError(r.json)?.code);

  // --- Expected balance after cash tx ---
  r = await req("GET", "/api/daily-close/today");
  const ledgerBefore = getData<{
    cash: { closing: number; income: number };
    transfer: { closing: number; income: number };
    business: { totalIncome: number };
  }>(r.json);
  record("GET /api/daily-close/today", r.status === 200, r.status);
  if (ledgerBefore) {
    record(
      "daily-close has cash + transfer",
      ledgerBefore.cash != null && ledgerBefore.transfer != null,
      undefined,
      `cash=${ledgerBefore.cash.closing} transfer=${ledgerBefore.transfer.closing}`
    );
  }

  r = await req("GET", "/api/cash-counts/today");
  const afterTx = r.json as { data?: { expectedBalance: number }; expectedBalance?: number };
  const expected = afterTx.data?.expectedBalance ?? afterTx.expectedBalance ?? 0;
  record("GET today after transactions", r.status === 200, r.status, `expected=${expected}`);

  // --- Cash count: update or create ---
  r = await req("GET", "/api/cash-counts/today");
  const todayRec = (r.json as { data?: { id: string; openingBalance: number } }).data;
  cashCountId = todayRec?.id ?? cashCountId;
  const opening = todayRec?.openingBalance ?? 0;
  const targetActual = opening + 70; // arbitrary test count

  if (cashCountId) {
    r = await req("PUT", `/api/cash-counts/${cashCountId}`, {
      openingBalance: opening,
      actualBalance: targetActual,
      note: "integration test",
    });
    const updated = getData<{ variance: number; status: string; expectedBalance: number }>(r.json);
    record(
      "PUT cash-count update actual",
      r.status === 200,
      r.status,
      updated ? `variance=${updated.variance} status=${updated.status}` : getError(r.json)?.message
    );

    // variance math check
    if (updated) {
      const calcVar = targetActual - updated.expectedBalance;
      record("variance = actual - expected", Math.abs(updated.variance - calcVar) < 0.01, undefined, `${updated.variance} vs ${calcVar}`);
    }
  } else {
    r = await req("POST", "/api/cash-counts", {
      countDate: businessToday,
      openingBalance: opening,
      actualBalance: targetActual,
      note: "integration test create",
    });
    const created = getData<{ id: string }>(r.json);
    if (created) cashCountId = created.id;
    record("POST cash-count create", r.status === 201 || r.status === 409, r.status, getError(r.json)?.message);
  }

  // --- POST duplicate cash count → 409 ---
  r = await req("POST", "/api/cash-counts", {
    countDate: businessToday,
    openingBalance: 0,
    actualBalance: 0,
  });
  record("POST cash-count duplicate → 409", r.status === 409, r.status, getError(r.json)?.code);

  // --- POST wrong date → 403 ---
  r = await req("POST", "/api/cash-counts", {
    countDate: yStr,
    openingBalance: 0,
    actualBalance: 0,
  });
  record("POST cash-count past date → 403", r.status === 403, r.status, getError(r.json)?.code);

  // --- GET history ---
  r = await req("GET", "/api/cash-counts");
  const history = getData<Array<{ countDate: string }>>(r.json) ?? [];
  record("GET /api/cash-counts history", r.status === 200, r.status, `rows=${history.length}`);

  // --- Reports ---
  r = await req("GET", `/api/reports/balance-summary?start=${businessToday}&end=${businessToday}`);
  record("GET balance-summary today", r.status === 200, r.status);

  r = await req("GET", `/api/reports/summary?start=${businessToday}&end=${businessToday}`);
  record("GET report summary today", r.status === 200, r.status);

  r = await req("GET", `/api/reports/by-category?start=${businessToday}&end=${businessToday}`);
  record("GET by-category today", r.status === 200, r.status);

  r = await req("GET", `/api/reports/daily-chart?start=${businessToday}&end=${businessToday}`);
  record("GET daily-chart today", r.status === 200, r.status);

  r = await req("GET", `/api/reports/export?start=${businessToday}&end=${businessToday}`);
  record("GET export CSV", r.status === 200, r.status);

  // --- Cash withdrawal + daily-close by date ---
  r = await req("GET", "/api/cash-withdrawals/today");
  record("GET /api/cash-withdrawals/today", r.status === 200, r.status);

  r = await req("POST", "/api/cash-withdrawals", {
    amount: 10,
    note: "integration test withdraw",
  });
  record(
    "POST cash-withdrawal",
    r.status === 201 || r.status === 503,
    r.status,
    getError(r.json)?.code ?? "ok"
  );

  r = await req("POST", "/api/cash-deposits", { amount: 25 });
  record(
    "POST cash-deposit",
    r.status === 201 || r.status === 503,
    r.status,
    getError(r.json)?.code ?? "ok"
  );

  r = await req("GET", `/api/cash-deposits?depositDate=${businessToday}`);
  const todayDeposits = getData<Array<{ amount: number }>>(r.json) ?? [];
  record(
    "GET cash-deposits today",
    r.status === 200,
    r.status,
    `rows=${todayDeposits.length}`
  );

  r = await req("GET", `/api/audit-logs?startDate=${businessToday}&endDate=${businessToday}`);
  const auditRows = getData<Array<{ entityType: string }>>(r.json) ?? [];
  const hasCashInAudit = auditRows.some(
    (row) => row.entityType === "cash_deposit" || row.entityType === "cash_withdrawal"
  );
  record(
    "audit-logs excludes cash deposit/withdraw",
    r.status === 200 && !hasCashInAudit,
    r.status,
    hasCashInAudit ? "BUG: cash movement in history" : `rows=${auditRows.length}`
  );

  r = await req("GET", `/api/daily-close/${businessToday}`);
  const ledgerDay = getData<{ cash: { withdrawn: number } }>(r.json);
  record("GET /api/daily-close/[date]", r.status === 200, r.status);
  if (ledgerDay && r.status === 200) {
    record(
      "daily-close reflects withdrawal",
      ledgerDay.cash.withdrawn >= 10,
      undefined,
      `withdrawn=${ledgerDay.cash.withdrawn}`
    );
  }

  r = await req("GET", `/api/cash-counts?date=${businessToday}`);
  const countByDate = getData<{ countDate: string } | null>(r.json);
  record(
    "GET /api/cash-counts?date=",
    r.status === 200 && (countByDate == null || countByDate.countDate === businessToday),
    r.status,
    countByDate ? `date=${countByDate.countDate}` : "no row"
  );

  r = await req("GET", "/api/cash-counts?date=bad-date");
  record("GET cash-counts bad date → 400", r.status === 400, r.status, getError(r.json)?.code);

  // --- Transaction GET filters ---
  r = await req("GET", "/api/transactions?type=income&status=active");
  record("GET transactions filter income", r.status === 200, r.status);

  r = await req("GET", "/api/transactions?type=expense&status=active");
  record("GET transactions filter expense", r.status === 200, r.status);

  // --- Void transaction ---
  if (createdTxIds.length > 0) {
    const voidId = createdTxIds[0];
    r = await req("POST", `/api/transactions/${voidId}/void`, { voidReason: "integration test void" });
    record("POST void transaction", r.status === 200, r.status, getError(r.json)?.message);

    r = await req("POST", `/api/transactions/${voidId}/void`, { voidReason: "double void" });
    record("POST double void → 400", r.status === 400, r.status, getError(r.json)?.code);
  }

  // --- Security: edit past date without admin (potential bug if passes) ---
  if (multiTx) {
    r = await req("PUT", `/api/transactions/${multiTx.id}`, {
      title: "backdate edit staff",
      paymentMethod: "cash",
      transactionDate: yStr,
      editReason: "try backdate",
      lineItems: [{ title: "x", quantity: 1, unitPrice: 1, categoryId: incomeCat.id }],
    });
    const backdateEditAllowed = r.status === 200;
    record(
      "PUT edit to past date (staff) should block",
      !backdateEditAllowed,
      r.status,
      backdateEditAllowed ? "BUG: allowed without admin" : getError(r.json)?.code ?? "blocked"
    );
  }

  // --- Cash count variance mismatch scenario ---
  if (cashCountId) {
    r = await req("GET", "/api/cash-counts/today");
    const exp = (r.json as { data?: { expectedBalance: number } }).data?.expectedBalance ?? 0;
    const mismatchActual = exp + 50;
    r = await req("PUT", `/api/cash-counts/${cashCountId}`, {
      actualBalance: mismatchActual,
      note: "variance test",
    });
    const mismatch = getData<{ variance: number; status: string }>(r.json);
    record(
      "PUT cash-count with +50 variance",
      r.status === 200 && mismatch?.status === "overage",
      r.status,
      mismatch ? `variance=${mismatch.variance}` : undefined
    );
  }

  // --- Clear drawer (เคลียร์ลิ้นชัก — ปิดวัน) — หลังทดสอบอื่น เพราะล็อกวัน ---
  r = await req("GET", "/api/cash-counts/today");
  const todayForClear = getData<{
    id?: string;
    closedAt?: string | null;
    expectedBalance?: number;
  }>(r.json);
  if (todayForClear?.id && !todayForClear.closedAt) {
    r = await req("POST", "/api/cash-counts/today/clear-drawer", {
      actualBalance: todayForClear.expectedBalance ?? 0,
    });
    record(
      "POST /api/cash-counts/today/clear-drawer",
      r.status === 200,
      r.status,
      getError(r.json)?.message
    );

    r = await req("POST", "/api/cash-counts/today/clear-drawer", {});
    record(
      "POST clear-drawer when locked → 403",
      r.status === 403,
      r.status,
      getError(r.json)?.code
    );
  } else {
    record(
      "POST /api/cash-counts/today/clear-drawer",
      !!todayForClear?.closedAt,
      undefined,
      todayForClear?.closedAt ? "already closed" : "no open row"
    );
  }

  // --- Admin header on cash count locked day (if yesterday closed) ---
  r = await req("GET", "/api/cash-counts");
  const allCounts = getData<Array<{ id: string; countDate: string; closedAt?: string | null }>>(r.json) ?? [];
  const closedPast = allCounts.find((c) => c.countDate < businessToday && c.closedAt);
  if (closedPast) {
    r = await req(
      "PUT",
      `/api/cash-counts/${closedPast.id}`,
      { note: "admin edit locked day" },
      { "X-Kiosk-Role": "admin" }
    );
    record(
      "PUT locked day as admin",
      r.status === 200,
      r.status,
      getError(r.json)?.message ?? "ok"
    );
    r = await req("PUT", `/api/cash-counts/${closedPast.id}`, { note: "staff edit locked" });
    record("PUT locked day as staff → 403", r.status === 403, r.status, getError(r.json)?.code);
  } else {
    record("PUT locked day as admin (skip)", true, undefined, "no closed past day in DB");
    record("PUT locked day as staff (skip)", true, undefined, "no closed past day in DB");
  }

  // --- Organization ---
  r = await req("GET", "/api/organizations");
  record("GET /api/organizations", r.status === 200, r.status);

  // --- Negative actual balance rejected ---
  if (cashCountId) {
    r = await req("PUT", `/api/cash-counts/${cashCountId}`, { actualBalance: -1 });
    record("PUT negative actual → 400", r.status === 400, r.status);
  }
  } finally {
    if (businessToday) {
      await cleanupTestArtifacts({ businessToday, cashCountId, createdTxIds });
    }
  }

  printSummary();
  const failed = results.filter((x) => !x.pass).length;
  process.exit(failed > 0 ? 1 : 0);
}

const ADMIN_HEADERS = { "X-Kiosk-Role": "admin" };

async function cleanupTestArtifacts(opts: {
  businessToday: string;
  cashCountId: string;
  createdTxIds: string[];
}) {
  console.log("\n--- Cleanup test data ---");

  for (const id of [...new Set(opts.createdTxIds)]) {
    await req(
      "POST",
      `/api/transactions/${id}/void`,
      { voidReason: "integration cleanup" },
      ADMIN_HEADERS
    );
  }

  const list = await req("GET", "/api/transactions?status=active");
  const active =
    getData<Array<{ id: string; title: string }>>(list.json) ?? [];
  for (const t of active) {
    if (/^(TEST |soft-test)/i.test(t.title)) {
      await req(
        "POST",
        `/api/transactions/${t.id}/void`,
        { voidReason: "integration cleanup" },
        ADMIN_HEADERS
      );
    }
  }

  const todayRes = await req("GET", "/api/cash-counts/today", undefined, ADMIN_HEADERS);
  const todayData = (
    todayRes.json as {
      data?: { id: string; openingBalance: number; expectedBalance: number };
    }
  ).data;

  if (todayData?.id) {
    await req(
      "PUT",
      `/api/cash-counts/${todayData.id}`,
      {
        openingBalance: todayData.openingBalance ?? 0,
        actualBalance: todayData.expectedBalance ?? 0,
        note: "",
      },
      ADMIN_HEADERS
    );
    console.log("  ✓ reset cash count for today");
  }

  console.log("  ✓ voided test transactions");
  console.log("  · withdrawals: npm run db:cleanup-test");
}

function printSummary() {
  const passed = results.filter((x) => x.pass).length;
  const failed = results.filter((x) => !x.pass);
  console.log(`\n=== Summary: ${passed}/${results.length} passed ===`);
  if (failed.length) {
    console.log("\nFailed tests:");
    for (const f of failed) {
      console.log(`  #${f.id} ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
