/**
 * ลบข้อมูลทั้งหมดใน Supabase (เก็บ org + users)
 * Run: npm run db:clear
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type PostgrestError } from "@supabase/supabase-js";
import { ORG_IDS } from "../constants/organizations";
import { createServiceRoleClient } from "./supabaseAdmin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

function assertOk(error: PostgrestError | null, label: string) {
  if (error) {
    console.error(`  ✗ ${label}:`, error.message);
    throw error;
  }
}

/** Supabase requires a filter on delete — match all rows */
const ALL = { filter: "id", op: "neq", value: "00000000-0000-0000-0000-000000000000" } as const;

async function clearTable(table: string) {
  const { error } = await db.from(table).delete().neq(ALL.filter, ALL.value);
  assertOk(error, table);
  console.log(`  ✓ cleared ${table}`);
}

async function clearDailyCloseTables() {
  let totalWithdrawals = 0;
  let totalCounts = 0;
  let rpcOk = true;

  for (const orgId of Object.values(ORG_IDS)) {
    const { data, error } = await db.rpc("fn_admin_clear_daily_close", {
      p_organization_id: orgId,
    });

    if (error) {
      rpcOk = false;
      break;
    }

    const payload = data as {
      cash_withdrawals_deleted?: number;
      cash_counts_deleted?: number;
    };
    totalWithdrawals += payload.cash_withdrawals_deleted ?? 0;
    totalCounts += payload.cash_counts_deleted ?? 0;
  }

  if (rpcOk) {
    console.log(`  ✓ cleared cash_withdrawals (${totalWithdrawals} rows)`);
    console.log(`  ✓ cleared cash_counts (${totalCounts} rows)`);
    return;
  }

  const admin = createServiceRoleClient();
  if (admin) {
    const ALL = "00000000-0000-0000-0000-000000000000";
    await admin.from("cash_withdrawals").delete().neq("id", ALL);
    await admin.from("cash_counts").delete().neq("id", ALL);
    console.log("  ✓ cleared cash_withdrawals (service role)");
    console.log("  ✓ cleared cash_counts (service role)");
    return;
  }

  console.log("  · skipped cash_withdrawals + cash_counts (RLS — run docs/supabase-admin-clear-daily-close.sql)");
}

async function clearAll() {
  console.log("Clearing Supabase data...\n");

  await clearTable("audit_logs");
  await clearDailyCloseTables();
  await clearTable("transaction_line_items");
  await clearTable("transactions");
  await clearTable("categories");

  console.log("\nDone — organizations + users kept.");
  console.log("Run `npm run db:seed` to restore default categories.");
}

clearAll().catch((err) => {
  console.error("\nClear failed:", err?.message ?? err);
  process.exit(1);
});
