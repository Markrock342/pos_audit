import { NextResponse } from "next/server";
import {
  getOrganization,
  updateOrganization,
} from "@/lib/services/db/organizations";

import { DEFAULT_ORG_ID } from "@/constants/organizations";

// ข้อมูลร้านต้องสดเสมอ — บันทึกแล้วต้องเห็นทันทีหลังรีเฟรช (ไม่ cache)
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

export async function GET() {
  const org = await getOrganization(DEFAULT_ORG_ID);
  if (!org) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Organization not found" } },
      { status: 404, headers: NO_STORE }
    );
  }
  return NextResponse.json({ data: org }, { headers: NO_STORE });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateOrganization(DEFAULT_ORG_ID, body);
    return NextResponse.json({ data: updated }, { headers: NO_STORE });
  } catch (e) {
    console.error("[organizations PUT]", e);
    return NextResponse.json(
      {
        error: {
          code: "UPDATE_FAILED",
          message: e instanceof Error ? e.message : "บันทึกข้อมูลร้านไม่สำเร็จ",
        },
      },
      { status: 500, headers: NO_STORE }
    );
  }
}
