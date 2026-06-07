/**
 * Seed script for Supabase.
 * Run with: npx tsx src/scripts/seed.ts
 * Requires NEXT_PUBLIC_SUPABASE_* env vars to be set.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env var");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

const ORG_ID = "default-org";
const USER_ID = "user-1";

async function seed() {
  console.log("Seeding Supabase...");

  // Seed Organization
  await db.from("organizations").upsert({
    id: ORG_ID,
    name: "บริษัท ตัวอย่าง จำกัด",
    tax_id: "1234567890123",
    address: "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    phone: "02-123-4567",
    currency: "THB",
    receipt_config: {
      header: "บริษัท ตัวอย่าง จำกัด",
      footer: "ขอบคุณที่ใช้บริการ",
      logo_url: "",
    },
    hardware_config: {
      printer_type: "thermal",
      ip: "192.168.1.100",
      port: 9100,
      drawer_command: "ESC p 0 50 50",
    },
    created_at: new Date().toISOString(),
  });
  console.log("  - Organization seeded");

  // Seed User
  await db.from("users").upsert({
    id: USER_ID,
    organization_id: ORG_ID,
    name: "เสมียน",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
  });
  console.log("  - User seeded");

  // Seed Categories
  const categories = [
    { id: "cat-1", organization_id: ORG_ID, name: "รายได้ขาย", type: "income", color: "#4CAF50", sort_order: 10, is_active: true, created_at: new Date().toISOString() },
    { id: "cat-2", organization_id: ORG_ID, name: "รายได้อื่น", type: "income", color: "#2196F3", sort_order: 20, is_active: true, created_at: new Date().toISOString() },
    { id: "cat-3", organization_id: ORG_ID, name: "ดอกเบี้ยรับ", type: "income", color: "#FF9800", sort_order: 30, is_active: true, created_at: new Date().toISOString() },
    { id: "cat-4", organization_id: ORG_ID, name: "ค่าเช่า", type: "expense", color: "#B22222", sort_order: 10, is_active: true, created_at: new Date().toISOString() },
    { id: "cat-5", organization_id: ORG_ID, name: "วัสดุสำนักงาน", type: "expense", color: "#6B8E23", sort_order: 20, is_active: true, created_at: new Date().toISOString() },
    { id: "cat-6", organization_id: ORG_ID, name: "ค่าน้ำ-ค่าไฟ", type: "expense", color: "#4682B4", sort_order: 30, is_active: true, created_at: new Date().toISOString() },
    { id: "cat-7", organization_id: ORG_ID, name: "ค่าใช้จ่ายอื่น", type: "expense", color: "#708090", sort_order: 40, is_active: true, created_at: new Date().toISOString() },
  ];

  await db.from("categories").upsert(categories);
  console.log(`  - ${categories.length} Categories seeded`);

  // Seed Transactions
  const transactions = [
    { id: "txn-1", organization_id: ORG_ID, type: "income", category_id: "cat-1", title: "รับชำระลูกค้า A", amount: 25000, note: "ใบแจ้งหนี้ INV-0042", payment_method: "transfer", reference_no: "INV-2026-0042", transaction_date: "2026-06-03", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-03T09:00:00.000Z" },
    { id: "txn-2", organization_id: ORG_ID, type: "income", category_id: "cat-2", title: "รับเงินสดย่อย", amount: 3500, payment_method: "cash", transaction_date: "2026-06-06", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-06T08:30:00.000Z" },
    { id: "txn-3", organization_id: ORG_ID, type: "expense", category_id: "cat-4", title: "ค่าเช่าสำนักงาน", amount: 15000, note: "โอนเจ้าของอาคาร", payment_method: "transfer", transaction_date: "2026-06-01", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-01T10:00:00.000Z" },
    { id: "txn-4", organization_id: ORG_ID, type: "expense", category_id: "cat-5", title: "ซื้อเครื่องเขียน", amount: 890, note: "ใบเสร็จ 7-11", payment_method: "cash", transaction_date: "2026-06-05", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-05T14:00:00.000Z" },
    { id: "txn-5", organization_id: ORG_ID, type: "expense", category_id: "cat-6", title: "ค่าไฟเดือนมิ.ย.", amount: 3500, payment_method: "transfer", transaction_date: "2026-06-05", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-05T10:00:00.000Z" },
    { id: "txn-6", organization_id: ORG_ID, type: "income", category_id: "cat-3", title: "รายได้อื่น", amount: 5000, payment_method: "cash", transaction_date: "2026-06-04", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-04T11:30:00.000Z" },
    { id: "txn-7", organization_id: ORG_ID, type: "expense", category_id: "cat-7", title: "ค่าน้ำประปา", amount: 450, payment_method: "transfer", transaction_date: "2026-06-02", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-02T16:00:00.000Z" },
    { id: "txn-8", organization_id: ORG_ID, type: "income", category_id: "cat-1", title: "รับชำระลูกค้า B", amount: 12000, note: "โอนเข้าบัญชีกสิกร", payment_method: "transfer", reference_no: "INV-2026-0045", transaction_date: "2026-06-06", status: "active", is_printed: false, created_by: USER_ID, created_at: "2026-06-06T13:45:00.000Z" },
  ];

  await db.from("transactions").upsert(transactions);
  console.log(`  - ${transactions.length} Transactions seeded`);

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
