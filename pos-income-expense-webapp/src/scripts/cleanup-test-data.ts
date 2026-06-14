/**
 * ลบข้อมูลทดสอบที่ค้างจาก integration test / test-software.sh
 * Run: npm run db:cleanup-test
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { DEFAULT_ORG_ID } from "../constants/organizations";
import { refreshOpenDailyCloseRecord } from "../lib/services/db/cashCounts";
import { getBusinessToday } from "../lib/utils/businessDate";
import { createAnonClient, createServiceRoleClient } from "./supabaseAdmin";

const TEST_TITLE = /^(TEST |soft-test)/i;
const TEST_WITHDRAW_NOTE = /integration test|soft test/i;

async function voidTestTransactions() {
  const admin = createServiceRoleClient() ?? createAnonClient();
  const { data, error } = await admin
    .from("transactions")
    .select("id, title, status")
    .eq("organization_id", DEFAULT_ORG_ID)
    .eq("status", "active");

  if (error) throw error;

  const targets = (data ?? []).filter((row) => TEST_TITLE.test(String(row.title ?? "")));
  if (targets.length === 0) {
    console.log("  · no active test transactions");
    return;
  }

  for (const row of targets) {
    const { error: voidErr } = await admin
      .from("transactions")
      .update({
        status: "void",
        void_reason: "cleanup test data",
        voided_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (voidErr) console.warn(`  ✗ void ${row.title}: ${voidErr.message}`);
    else console.log(`  ✓ voided: ${row.title}`);
  }
}

async function deleteTestWithdrawals() {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.log("  · skipped withdrawals (no SUPABASE_SERVICE_ROLE_KEY)");
    return;
  }

  const { data, error } = await admin
    .from("cash_withdrawals")
    .select("id, note, amount")
    .eq("organization_id", DEFAULT_ORG_ID);

  if (error) throw error;

  const targets = (data ?? []).filter((row) => TEST_WITHDRAW_NOTE.test(String(row.note ?? "")));
  if (targets.length === 0) {
    console.log("  · no test withdrawals");
    return;
  }

  for (const row of targets) {
    const { error: delErr } = await admin.from("cash_withdrawals").delete().eq("id", row.id);
    if (delErr) console.warn(`  ✗ delete withdrawal: ${delErr.message}`);
    else console.log(`  ✓ deleted withdrawal ฿${row.amount} — ${row.note}`);
  }
}

async function resetTodayCashCount() {
  const admin = createServiceRoleClient() ?? createAnonClient();
  const today = getBusinessToday();
  const { data: row, error } = await admin
    .from("cash_counts")
    .select("id, opening_balance, closed_at")
    .eq("organization_id", DEFAULT_ORG_ID)
    .eq("count_date", today)
    .maybeSingle();

  if (error) throw error;
  if (!row) {
    console.log("  · no cash count row for today");
    return;
  }
  if (row.closed_at) {
    console.log("  · today already closed — skip cash count reset");
    return;
  }

  await refreshOpenDailyCloseRecord(DEFAULT_ORG_ID, today);

  const { data: refreshed } = await admin
    .from("cash_counts")
    .select("expected_balance")
    .eq("id", row.id)
    .single();

  const expected = Number(refreshed?.expected_balance ?? 0);
  const { error: updErr } = await admin
    .from("cash_counts")
    .update({
      actual_balance: expected,
      variance: 0,
      status: "balanced",
      note: null,
      has_manual_count: false,
    })
    .eq("id", row.id);

  if (updErr) console.warn(`  ✗ reset cash count: ${updErr.message}`);
  else console.log(`  ✓ reset cash count today → ฿${expected}`);
}

async function main() {
  console.log("Cleaning up test artifacts...\n");
  await voidTestTransactions();
  await deleteTestWithdrawals();
  await resetTodayCashCount();
  console.log("\nDone — refresh หน้าเว็บแล้วตรวจยอด");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
