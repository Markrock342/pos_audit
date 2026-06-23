/**
 * ทดสอบ: ฝาก → POS ขึ้น, ปิดวัน → ยอดรับ-จ่ายวันนี้เป็น 0
 * Run: TEST_BASE_URL=http://localhost:3001 npx tsx src/scripts/test-daily-close-display.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { DEFAULT_ORG_ID } from "../constants/organizations";
import { getBusinessToday } from "../lib/utils/businessDate";
import { createServiceRoleClient } from "./supabaseAdmin";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TEST_DEPOSIT = 1000;
const TEST_INCOME = 500;
const TEST_TITLE = "TEST daily-close-display";

type DashboardData = {
  todayIncome: number;
  todayExpense: number;
  expectedCashBalance: number;
  dailyCloseStatus: { isLocked: boolean; closedAt?: string; cashClosing: number };
};

async function api<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function data<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return null;
}

async function getDashboard(): Promise<DashboardData> {
  const { status, json } = await api("GET", "/api/reports/dashboard");
  if (status !== 200) throw new Error(`dashboard ${status}: ${JSON.stringify(json)}`);
  const d = data<DashboardData>(json);
  if (!d) throw new Error("dashboard missing data");
  return d;
}

async function reopenToday() {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.warn("  · skip reopen (no SUPABASE_SERVICE_ROLE_KEY)");
    return;
  }
  const today = getBusinessToday();
  await admin.from("cash_withdrawals").delete().eq("organization_id", DEFAULT_ORG_ID).eq("withdrawal_date", today);
  await admin.from("cash_deposits").delete().eq("organization_id", DEFAULT_ORG_ID).eq("deposit_date", today);
  await admin.from("cash_counts").delete().eq("organization_id", DEFAULT_ORG_ID).eq("count_date", today);
  console.log("  ✓ reopened today (deleted withdrawals, deposits, cash_count row)");
}

async function cleanup(opts: { txnId?: string }) {
  console.log("\n--- Cleanup ---");
  const admin = createServiceRoleClient();

  if (opts.txnId) {
    await api("POST", `/api/transactions/${opts.txnId}/void`, {
      voidReason: "test daily-close-display cleanup",
    });
  }

  if (admin) {
    const { data: txns } = await admin
      .from("transactions")
      .select("id, title, status")
      .eq("organization_id", DEFAULT_ORG_ID)
      .eq("status", "active");
    for (const row of txns ?? []) {
      if (String(row.title ?? "").startsWith("TEST ")) {
        await admin
          .from("transactions")
          .update({
            status: "void",
            void_reason: "test daily-close-display cleanup",
            voided_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        console.log(`  ✓ voided ${row.title}`);
      }
    }
  }

  await reopenToday();
  console.log("Done cleanup\n");
}

async function main() {
  console.log(`=== Test daily-close display @ ${BASE} ===\n`);

  await reopenToday();

  const before = await getDashboard();
  console.log("Before:", {
    todayIncome: before.todayIncome,
    expectedCashBalance: before.expectedCashBalance,
  });

  if (before.dailyCloseStatus.isLocked && before.dailyCloseStatus.closedAt) {
    throw new Error("วันนี้ปิดอยู่แล้ว — cleanup ไม่สำเร็จ");
  }

  const dep = await api("POST", "/api/cash-deposits", { amount: TEST_DEPOSIT });
  if (dep.status !== 201) throw new Error(`deposit failed ${dep.status}: ${JSON.stringify(dep.json)}`);

  const afterDeposit = await getDashboard();
  const cashDelta = afterDeposit.expectedCashBalance - before.expectedCashBalance;
  if (cashDelta !== TEST_DEPOSIT) {
    throw new Error(
      `deposit POS check FAIL: expected +${TEST_DEPOSIT}, got +${cashDelta} (before=${before.expectedCashBalance}, after=${afterDeposit.expectedCashBalance})`
    );
  }
  console.log(`✓ deposit ${TEST_DEPOSIT} → POS +${cashDelta}`);

  const catRes = await api("GET", "/api/categories?type=income");
  const cats = data<Array<{ id: string }>>(catRes.json) ?? [];
  const catId = cats[0]?.id;
  if (!catId) throw new Error("no income category");

  const txnRes = await api("POST", "/api/transactions", {
    type: "income",
    title: TEST_TITLE,
    paymentMethod: "cash",
    transactionDate: getBusinessToday(),
    createdBy: "33333333-3333-3333-3333-333333333333",
    lineItems: [
      {
        title: "รายการทดสอบ",
        quantity: 1,
        unitPrice: TEST_INCOME,
        categoryId: catId,
      },
    ],
  });
  const txn = data<{ id: string }>(txnRes.json);
  if (txnRes.status !== 201 || !txn?.id) {
    throw new Error(`create txn failed: ${JSON.stringify(txnRes.json)}`);
  }

  const afterIncome = await getDashboard();
  if (afterIncome.todayIncome < TEST_INCOME) {
    throw new Error(
      `todayIncome FAIL: expected >= ${TEST_INCOME}, got ${afterIncome.todayIncome}`
    );
  }
  console.log(`✓ income ${TEST_INCOME} → todayIncome ${afterIncome.todayIncome}`);

  const clear = await api("POST", "/api/cash-counts/today/clear-drawer", {});
  if (clear.status !== 200) {
    throw new Error(`clear-drawer failed ${clear.status}: ${JSON.stringify(clear.json)}`);
  }
  console.log("✓ clear-drawer OK");

  const afterClose = await getDashboard();
  if (afterClose.todayIncome !== 0 || afterClose.todayExpense !== 0) {
    throw new Error(
      `cleared totals FAIL: income=${afterClose.todayIncome}, expense=${afterClose.todayExpense}`
    );
  }
  if (afterClose.expectedCashBalance !== 0) {
    throw new Error(`cleared POS FAIL: expected 0, got ${afterClose.expectedCashBalance}`);
  }
  console.log("✓ after close: todayIncome=0, todayExpense=0, POS=0");

  await cleanup({ txnId: txn.id });
  console.log("=== ALL PASSED ===");
}

main().catch(async (e) => {
  console.error("\nFAILED:", e instanceof Error ? e.message : e);
  try {
    await cleanup({});
  } catch {
    /* ignore */
  }
  process.exit(1);
});
