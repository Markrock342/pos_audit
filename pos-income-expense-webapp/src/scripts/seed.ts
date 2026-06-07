/**
 * Seed script for Supabase.
 * Run with: npx tsx src/scripts/seed.ts
 * Requires NEXT_PUBLIC_SUPABASE_* env vars in .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, type PostgrestError } from "@supabase/supabase-js";
import { ORG_IDS } from "../constants/organizations";
import { KIOSK_ACCOUNTS } from "../constants/kioskUsers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

const customerAccount = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!;
const devAccount = KIOSK_ACCOUNTS.find((a) => a.type === "dev")!;

function assertOk(error: PostgrestError | null, label: string) {
  if (error) {
    console.error(`  ✗ ${label}:`, error.message);
    throw error;
  }
}

async function seed() {
  console.log("Seeding Supabase...\n");

  // Organizations — ลูกค้า vs dev แยกกัน
  const orgs = [
    {
      id: ORG_IDS.customer,
      name: "บัญชีร้าน (ลูกค้า)",
      tax_id: "1234567890123",
      address: "ที่อยู่ร้านลูกค้า",
      phone: "02-123-4567",
      currency: "THB",
      receipt_config: { header: "บัญชีร้าน", footer: "ขอบคุณที่ใช้บริการ" },
      hardware_config: { printer_type: "thermal", ip: "192.168.1.100", port: 9100 },
    },
    {
      id: ORG_IDS.dev,
      name: "Sandbox Dev",
      tax_id: null,
      address: "ทดสอบระบบ — ไม่ใช่ข้อมูลลูกค้า",
      phone: null,
      currency: "THB",
      receipt_config: { header: "[DEV] ทดสอบ", footer: "sandbox only" },
      hardware_config: {},
    },
  ];

  const { error: orgErr } = await db.from("organizations").upsert(orgs);
  assertOk(orgErr, "organizations");
  console.log("  ✓ 2 organizations (ลูกค้า + dev)");

  // Users — ชื่อผู้ใช้แยกกัน
  const users = [
    {
      id: customerAccount.userId,
      organization_id: ORG_IDS.customer,
      name: customerAccount.displayName,
      email: "customer@shop.local",
      role: customerAccount.role,
      is_active: true,
    },
    {
      id: devAccount.userId,
      organization_id: ORG_IDS.dev,
      name: devAccount.displayName,
      email: "dev@internal.local",
      role: devAccount.role,
      is_active: true,
    },
  ];

  const { error: userErr } = await db.from("users").upsert(users);
  assertOk(userErr, "users");
  console.log(`  ✓ 2 users — ลูกค้า: "${customerAccount.username}" / dev: "${devAccount.username}"`);

  // Categories — เฉพาะ org ลูกค้า
  const categories = [
    { id: "55555555-5555-5555-5555-555555555501", organization_id: ORG_IDS.customer, name: "รายได้ขาย", type: "income", color: "#4CAF50", sort_order: 10, is_active: true },
    { id: "55555555-5555-5555-5555-555555555502", organization_id: ORG_IDS.customer, name: "รายได้อื่น", type: "income", color: "#2196F3", sort_order: 20, is_active: true },
    { id: "55555555-5555-5555-5555-555555555503", organization_id: ORG_IDS.customer, name: "ดอกเบี้ยรับ", type: "income", color: "#FF9800", sort_order: 30, is_active: true },
    { id: "55555555-5555-5555-5555-555555555504", organization_id: ORG_IDS.customer, name: "ค่าเช่า", type: "expense", color: "#B22222", sort_order: 10, is_active: true },
    { id: "55555555-5555-5555-5555-555555555505", organization_id: ORG_IDS.customer, name: "วัสดุสำนักงาน", type: "expense", color: "#6B8E23", sort_order: 20, is_active: true },
    { id: "55555555-5555-5555-5555-555555555506", organization_id: ORG_IDS.customer, name: "ค่าน้ำ-ค่าไฟ", type: "expense", color: "#4682B4", sort_order: 30, is_active: true },
    { id: "55555555-5555-5555-5555-555555555507", organization_id: ORG_IDS.customer, name: "ค่าใช้จ่ายอื่น", type: "expense", color: "#708090", sort_order: 40, is_active: true },
  ];

  const { error: catErr } = await db.from("categories").upsert(categories);
  assertOk(catErr, "categories");
  console.log(`  ✓ ${categories.length} categories (org ลูกค้า)`);

  const cat = (n: number) => categories[n].id;
  const transactions = [
    { id: "66666666-6666-6666-6666-666666666601", organization_id: ORG_IDS.customer, type: "income", category_id: cat(0), title: "รับชำระลูกค้า A", amount: 25000, note: "INV-0042", payment_method: "transfer", reference_no: "INV-2026-0042", transaction_date: "2026-06-03", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-03T09:00:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666602", organization_id: ORG_IDS.customer, type: "income", category_id: cat(1), title: "รับเงินสดย่อย", amount: 3500, payment_method: "cash", transaction_date: "2026-06-06", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-06T08:30:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666603", organization_id: ORG_IDS.customer, type: "expense", category_id: cat(3), title: "ค่าเช่าสำนักงาน", amount: 15000, payment_method: "transfer", transaction_date: "2026-06-01", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-01T10:00:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666604", organization_id: ORG_IDS.customer, type: "expense", category_id: cat(4), title: "ซื้อเครื่องเขียน", amount: 890, payment_method: "cash", transaction_date: "2026-06-05", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-05T14:00:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666605", organization_id: ORG_IDS.customer, type: "expense", category_id: cat(5), title: "ค่าไฟเดือนมิ.ย.", amount: 3500, payment_method: "transfer", transaction_date: "2026-06-05", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-05T10:00:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666606", organization_id: ORG_IDS.customer, type: "income", category_id: cat(2), title: "รายได้อื่น", amount: 5000, payment_method: "cash", transaction_date: "2026-06-04", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-04T11:30:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666607", organization_id: ORG_IDS.customer, type: "expense", category_id: cat(6), title: "ค่าน้ำประปา", amount: 450, payment_method: "transfer", transaction_date: "2026-06-02", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-02T16:00:00.000Z" },
    { id: "66666666-6666-6666-6666-666666666608", organization_id: ORG_IDS.customer, type: "income", category_id: cat(0), title: "รับชำระลูกค้า B", amount: 12000, payment_method: "transfer", reference_no: "INV-2026-0045", transaction_date: "2026-06-06", status: "active", is_printed: false, created_by: customerAccount.userId, created_at: "2026-06-06T13:45:00.000Z" },
  ];

  const { error: txnErr } = await db.from("transactions").upsert(transactions);
  assertOk(txnErr, "transactions");
  console.log(`  ✓ ${transactions.length} transactions (org ลูกค้า)`);

  console.log("\nSeed complete!");
  console.log(`  ลูกค้า login: ${customerAccount.username} / PIN ${customerAccount.pin}`);
  console.log(`  Dev login:    ${devAccount.username} / PIN ${devAccount.pin}`);
}

seed().catch((err) => {
  console.error("\nSeed failed:", err?.message ?? err);
  process.exit(1);
});
