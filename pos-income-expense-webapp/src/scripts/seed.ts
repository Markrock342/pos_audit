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

type SeedOrganizationRow = {
  id: string;
  name: string;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
  receipt_config: Record<string, string>;
  hardware_config: Record<string, unknown>;
};

async function seed() {
  console.log("Seeding Supabase...\n");

  // Organizations — ลูกค้า vs dev แยกกัน
  const orgs: SeedOrganizationRow[] = [
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

  // ไม่ upsert ทับ — เก็บข้อมูลร้านที่ลูกค้าแก้ในหน้าตั้งค่า
  for (const org of orgs) {
    const { data: existing } = await db
      .from("organizations")
      .select("id")
      .eq("id", org.id)
      .maybeSingle();
    if (existing) {
      console.log(`  · organizations: ข้าม ${org.name} (มีอยู่แล้ว — ไม่ทับ)`);
      continue;
    }
    const { error } = await db.from("organizations").insert(org);
    assertOk(error, `organizations ${org.id}`);
    console.log(`  ✓ organizations: สร้าง ${org.name}`);
  }

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

  // Categories — ตามสเปกลูกค้า (รายรับ 2 / รายจ่าย 4)
  const categories = [
    { id: "55555555-5555-5555-5555-555555555501", organization_id: ORG_IDS.customer, name: "ค่าสินค้า", type: "income", color: "#4CAF50", sort_order: 10, is_active: true },
    { id: "55555555-5555-5555-5555-555555555502", organization_id: ORG_IDS.customer, name: "ค่าอื่นๆ", type: "income", color: "#8BC34A", sort_order: 20, is_active: true },
    { id: "55555555-5555-5555-5555-555555555505", organization_id: ORG_IDS.customer, name: "ค่าคนงาน", type: "expense", color: "#B22222", sort_order: 10, is_active: true },
    { id: "55555555-5555-5555-5555-555555555506", organization_id: ORG_IDS.customer, name: "ค่าขนส่ง", type: "expense", color: "#6B8E23", sort_order: 20, is_active: true },
    { id: "55555555-5555-5555-5555-555555555507", organization_id: ORG_IDS.customer, name: "ค่าสินค้า", type: "expense", color: "#4682B4", sort_order: 30, is_active: true },
    { id: "55555555-5555-5555-5555-555555555508", organization_id: ORG_IDS.customer, name: "ค่าเบี้ยเลี้ยง", type: "expense", color: "#708090", sort_order: 40, is_active: true },
  ];

  const { error: catErr } = await db.from("categories").upsert(categories);
  assertOk(catErr, "categories");
  console.log(`  ✓ ${categories.length} categories (org ลูกค้า)`);

  // ไม่ seed รายการตัวอย่าง — ลูกค้าบันทึกเอง
  console.log("  ✓ transactions: ว่าง (ไม่มี mock)");

  console.log("\nSeed complete!");
  console.log(`  ลูกค้า login: ${customerAccount.username} / PIN ${customerAccount.pin}`);
  console.log(`  Dev login:    ${devAccount.username} / PIN ${devAccount.pin}`);
}

seed().catch((err) => {
  console.error("\nSeed failed:", err?.message ?? err);
  process.exit(1);
});
