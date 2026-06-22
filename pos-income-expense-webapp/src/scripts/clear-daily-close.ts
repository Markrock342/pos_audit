/**
 * ลบประวัติปิดยอดย้อนหลัง + ถอนเงินสด (เก็บรายรับ-รายจ่ายไว้)
 * Run: npm run db:clear-daily-close
 *
 * ต้องรัน docs/supabase-admin-clear-daily-close.sql ใน Supabase SQL Editor ก่อน (ครั้งเดียว)
 * หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { ORG_IDS } from "../constants/organizations";
import {
  createAnonClient,
  createServiceRoleClient,
  getAnonKey,
  getSupabaseUrl,
} from "./supabaseAdmin";

const ALL_ORGS = process.argv.includes("--all");

async function clearViaRpc(): Promise<{ withdrawals: number; counts: number } | null> {
  const db = createAnonClient();
  const orgIds = ALL_ORGS ? Object.values(ORG_IDS) : [ORG_IDS.customer];
  let totalWithdrawals = 0;
  let totalCounts = 0;
  let rpcMissing = false;

  for (const orgId of orgIds) {
    const { data, error } = await db.rpc("fn_admin_clear_daily_close", {
      p_organization_id: orgId,
    });

    if (error) {
      if (
        error.message.includes("Could not find the function") ||
        error.message.includes("schema cache")
      ) {
        rpcMissing = true;
        break;
      }
      throw error;
    }

    const payload = data as {
      cash_withdrawals_deleted?: number;
      cash_counts_deleted?: number;
    };
    totalWithdrawals += payload.cash_withdrawals_deleted ?? 0;
    totalCounts += payload.cash_counts_deleted ?? 0;
  }

  if (rpcMissing) return null;

  return { withdrawals: totalWithdrawals, counts: totalCounts };
}

async function clearViaServiceRole(): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  }

  const ALL = "00000000-0000-0000-0000-000000000000";
  let wq = admin.from("cash_withdrawals").delete().neq("id", ALL);
  let cq = admin.from("cash_counts").delete().neq("id", ALL);

  if (!ALL_ORGS) {
    wq = wq.eq("organization_id", ORG_IDS.customer);
    cq = cq.eq("organization_id", ORG_IDS.customer);
  }

  const { error: wErr } = await wq;
  if (wErr) throw wErr;
  const { error: cErr } = await cq;
  if (cErr) throw cErr;
}

async function verifyCleared() {
  const db = createAnonClient();
  const orgFilter = ALL_ORGS ? undefined : ORG_IDS.customer;

  let wq = db.from("cash_withdrawals").select("id", { count: "exact", head: true });
  let cq = db.from("cash_counts").select("id", { count: "exact", head: true });
  if (orgFilter) {
    wq = wq.eq("organization_id", orgFilter);
    cq = cq.eq("organization_id", orgFilter);
  }

  const [{ count: withdrawals }, { count: counts }] = await Promise.all([wq, cq]);
  return { withdrawals: withdrawals ?? 0, counts: counts ?? 0 };
}

async function clearDailyClose() {
  if (!getSupabaseUrl() || !getAnonKey()) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  console.log(
    ALL_ORGS
      ? "Clearing daily close history (all orgs)...\n"
      : "Clearing daily close history (org ลูกค้า)...\n"
  );

  let result = await clearViaRpc();

  if (!result) {
    console.log("  · RPC fn_admin_clear_daily_close not found — trying service role...");
    try {
      await clearViaServiceRole();
      result = { withdrawals: -1, counts: -1 };
    } catch {
      console.error(`
  ✗ ลบไม่ได้ — Supabase บล็อก DELETE ผ่าน anon key (RLS)

  ทำอย่างใดอย่างหนึ่ง:
  1) รัน SQL ใน Supabase Dashboard → SQL Editor:
     docs/supabase-admin-clear-daily-close.sql
     แล้วรัน npm run db:clear-daily-close อีกครั้ง

  2) ใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local แล้วรันคำสั่งนี้อีกครั้ง
`);
      process.exit(1);
    }
  }

  if (result.withdrawals >= 0) {
    console.log(`  ✓ deleted cash_withdrawals (${result.withdrawals} rows)`);
    console.log(`  ✓ deleted cash_counts (${result.counts} rows)`);
  } else {
    console.log("  ✓ cleared via service role");
  }

  const remaining = await verifyCleared();
  if (remaining.withdrawals > 0 || remaining.counts > 0) {
    console.error(
      `\n  ✗ ยังเหลือข้อมูล cash_withdrawals=${remaining.withdrawals}, cash_counts=${remaining.counts}`
    );
    console.error("  รัน docs/supabase-admin-clear-daily-close.sql ใน Supabase แล้วลองใหม่");
    process.exit(1);
  }

  console.log("\nDone — ประวัติปิดยอดย้อนหลังถูกลบแล้ว (รายรับ-รายจ่ายยังอยู่).");
  console.log("Refresh หน้า /cash-count ในเบราว์เซอร์");
}

clearDailyClose().catch((err) => {
  console.error("\nClear failed:", err?.message ?? err);
  process.exit(1);
});
