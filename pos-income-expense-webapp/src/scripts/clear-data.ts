/**
 * ลบข้อมูลทั้งหมดใน Supabase (เก็บ org + users)
 * Run: npm run db:clear
 *
 * cash_deposits / cash_counts / cash_withdrawals ต้องใช้ RPC หรือ service role
 * ถ้าลบไม่ครบ: รัน docs/supabase-go-live-clear-all.sql ใน Supabase SQL Editor
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
const ALL_ORG_IDS = [ORG_IDS.customer, ORG_IDS.dev] as const;

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

async function clearDailyCloseForOrg(orgId: string) {
  const { data, error } = await db.rpc("fn_admin_clear_daily_close", {
    p_organization_id: orgId,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      throw new Error("ไม่พบ fn_admin_clear_daily_close — รัน docs/supabase-admin-clear-daily-close.sql");
    }
    throw error;
  }

  const payload = data as {
    cash_withdrawals_deleted?: number;
    cash_counts_deleted?: number;
  };
  console.log(
    `  ✓ org ${orgId.slice(0, 8)}… withdrawals=${payload.cash_withdrawals_deleted ?? 0} counts=${payload.cash_counts_deleted ?? 0}`
  );
}

async function clearDepositsForOrg(orgId: string) {
  const { data, error } = await db.rpc("fn_admin_clear_cash_deposits", {
    p_organization_id: orgId,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      const admin = createServiceRoleClient();
      if (admin) {
        const { error: delErr } = await admin
          .from("cash_deposits")
          .delete()
          .eq("organization_id", orgId);
        assertOk(delErr, `cash_deposits (${orgId.slice(0, 8)})`);
        console.log(`  ✓ cleared cash_deposits org ${orgId.slice(0, 8)}… (service role)`);
        return;
      }
      console.log(
        "  · skipped cash_deposits — รัน docs/supabase-admin-clear-cash-deposits.sql หรือ supabase-go-live-clear-all.sql"
      );
      return;
    }
    throw error;
  }

  const payload = data as { cash_deposits_deleted?: number };
  console.log(
    `  ✓ org ${orgId.slice(0, 8)}… deposits=${payload.cash_deposits_deleted ?? 0}`
  );
}

async function clearCashMovementTables() {
  for (const orgId of ALL_ORG_IDS) {
    await clearDailyCloseForOrg(orgId);
    await clearDepositsForOrg(orgId);
  }
}

async function clearAll() {
  console.log("Clearing Supabase data...\n");

  await clearTable("audit_logs");
  await clearCashMovementTables();
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
