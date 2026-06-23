/**
 * เปิดยอดวันที่ปิดแล้ว — ลบ closed_at + ถอนเคลียร์ลิ้นชัก แล้ว sync ledger
 * Run: npm run db:reopen-day -- 2026-06-23
 *
 * ต้องรัน docs/supabase-admin-reopen-business-day.sql ใน Supabase SQL Editor ก่อน (ครั้งเดียว)
 * หรือใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { ORG_IDS } from "../constants/organizations";
import { CLEAR_DRAWER_NOTE } from "../lib/services/db/cashCounts";
import { getDailyLedgerSummary, ledgerPatchFromSummary } from "../lib/services/db/dailyLedger";
import {
  createAnonClient,
  createServiceRoleClient,
  getAnonKey,
  getSupabaseUrl,
} from "./supabaseAdmin";

const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error("Usage: npm run db:reopen-day -- YYYY-MM-DD");
  process.exit(1);
}

const ORG_ID = ORG_IDS.customer;
const COUNT_DATE = dateArg;

async function reopenViaRpc(): Promise<{ closingCash?: number } | null> {
  const db = createAnonClient();
  const { data, error } = await db.rpc("fn_admin_reopen_business_day", {
    p_organization_id: ORG_ID,
    p_count_date: COUNT_DATE,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      return null;
    }
    throw error;
  }

  const payload = data as {
    already_open?: boolean;
    reopened?: boolean;
    closing_cash?: number;
  };

  if (payload.already_open) {
    console.log(`วัน ${COUNT_DATE} เปิดอยู่แล้ว (ยังไม่ปิดยอด)`);
    return payload;
  }

  console.log(`  ✓ reopened via RPC (closing_cash=${payload.closing_cash ?? "?"})`);
  return payload;
}

async function reopenViaServiceRole(): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  }

  const { data: row, error: fetchErr } = await admin
    .from("cash_counts")
    .select("id, count_date, closed_at, organization_id")
    .eq("organization_id", ORG_ID)
    .eq("count_date", COUNT_DATE)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!row) {
    console.error(`ไม่พบ cash_counts สำหรับ ${COUNT_DATE}`);
    process.exit(1);
  }
  if (!row.closed_at) {
    console.log(`วัน ${COUNT_DATE} เปิดอยู่แล้ว (ยังไม่ปิดยอด)`);
    return;
  }

  const { data: drawerWithdrawals, error: wErr } = await admin
    .from("cash_withdrawals")
    .select("id")
    .eq("organization_id", ORG_ID)
    .eq("withdrawal_date", COUNT_DATE)
    .eq("note", CLEAR_DRAWER_NOTE);

  if (wErr) throw wErr;

  const drawerIds = (drawerWithdrawals ?? []).map((w) => w.id as string);
  if (drawerIds.length > 0) {
    const { error: delErr } = await admin.from("cash_withdrawals").delete().in("id", drawerIds);
    if (delErr) throw delErr;
    console.log(`  ✓ ลบถอนเคลียร์ลิ้นชัก ${drawerIds.length} รายการ`);
  } else {
    console.log("  · ไม่พบถอนเคลียร์ลิ้นชัก (ข้าม)");
  }

  const ledger = await getDailyLedgerSummary(ORG_ID, COUNT_DATE, { forceRecalc: true });

  const patch = {
    ...ledgerPatchFromSummary(ledger),
    closed_at: null,
    closing_type: null,
    auto_closed: false,
    has_manual_count: false,
    actual_balance: 0,
    variance: -ledger.cash.closing,
    status: ledger.cash.closing === 0 ? "balanced" : "short",
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updErr } = await admin
    .from("cash_counts")
    .update(patch)
    .eq("id", row.id)
    .select("id, closed_at")
    .maybeSingle();

  if (updErr) throw updErr;
  if (!updated?.id || updated.closed_at) {
    throw new Error("อัปเดตไม่สำเร็จ — ตรวจ RLS หรือใช้ RPC fn_admin_reopen_business_day");
  }

  console.log(`  ✓ เงินใน POS (คำนวณ): ${ledger.cash.closing}`);
}

async function verifyReopened(): Promise<boolean> {
  const db = createAnonClient();
  const { data, error } = await db
    .from("cash_counts")
    .select("closed_at, closing_cash")
    .eq("organization_id", ORG_ID)
    .eq("count_date", COUNT_DATE)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    console.error(`ไม่พบ cash_counts สำหรับ ${COUNT_DATE}`);
    return false;
  }

  if (data.closed_at) {
    console.error(`\n  ✗ ยังปิดอยู่ (closed_at=${data.closed_at})`);
    return false;
  }

  console.log(`\n✓ เปิดยอดวัน ${COUNT_DATE} แล้ว — เงินใน POS: ${data.closing_cash ?? 0}`);
  console.log("  Refresh หน้า /cash-count และ /dashboard");
  return true;
}

async function main() {
  if (!getSupabaseUrl() || !getAnonKey()) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  console.log(`Reopening business day ${COUNT_DATE} (org ลูกค้า)...\n`);

  let rpcResult = await reopenViaRpc();

  if (!rpcResult) {
    console.log("  · RPC fn_admin_reopen_business_day not found — trying service role...");
    try {
      await reopenViaServiceRole();
    } catch {
      console.error(`
  ✗ เปิดยอดไม่ได้ — Supabase บล็อก UPDATE ผ่าน anon key (RLS)

  ทำอย่างใดอย่างหนึ่ง:
  1) รัน SQL ใน Supabase Dashboard → SQL Editor:
     docs/supabase-admin-reopen-business-day.sql
     แล้วรัน npm run db:reopen-day -- ${COUNT_DATE} อีกครั้ง

  2) ใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local แล้วรันคำสั่งนี้อีกครั้ง
`);
      process.exit(1);
    }
  }

  const ok = await verifyReopened();
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error("\nFailed:", err?.message ?? err);
  process.exit(1);
});
