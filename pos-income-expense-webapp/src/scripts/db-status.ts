/**
 * ตรวจสอบจำนวนแถวใน Supabase
 * Run: npm run db:status
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function countTable(table: string) {
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
  if (error) return `${table}: error — ${error.message}`;
  return `${table}: ${count ?? 0}`;
}

async function main() {
  console.log("Supabase row counts (anon key):\n");
  for (const table of [
    "cash_counts",
    "cash_withdrawals",
    "cash_deposits",
    "transactions",
    "transaction_line_items",
    "audit_logs",
    "categories",
  ]) {
    console.log(" ", await countTable(table));
  }

  const { data: cash } = await db
    .from("cash_counts")
    .select("count_date, closed_at, opening_balance, closing_cash, organization_id")
    .order("count_date", { ascending: false })
    .limit(10);

  console.log("\nLatest cash_counts:");
  if (!cash?.length) {
    console.log("  (none)");
  } else {
    for (const row of cash) {
      console.log(
        `  ${row.count_date} org=${String(row.organization_id).slice(0, 8)} closed=${!!row.closed_at} opening=${row.opening_balance} closing=${row.closing_cash}`
      );
    }
  }

  const { data: orgs } = await db.from("organizations").select("name, finance_config");
  console.log("\nfinance_config:");
  for (const org of orgs ?? []) {
    console.log(`  ${org.name}:`, JSON.stringify(org.finance_config));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
