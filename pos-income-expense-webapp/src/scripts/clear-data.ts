/**
 * ลบข้อมูลทั้งหมดใน Supabase (เก็บ org + users)
 * Run: npm run db:clear
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type PostgrestError } from "@supabase/supabase-js";

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

async function clearAll() {
  console.log("Clearing Supabase data...\n");

  await clearTable("audit_logs");
  await clearTable("cash_counts");
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
