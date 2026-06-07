import { NextResponse } from "next/server";
import {
  getOrganization,
  updateOrganization,
} from "@/lib/services/db/organizations";

const DEFAULT_ORG_ID = "default-org"; // MVP: single organization

export async function GET() {
  const org = await getOrganization(DEFAULT_ORG_ID);
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }
  return NextResponse.json({ data: org });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = await updateOrganization(DEFAULT_ORG_ID, body);
  return NextResponse.json({ data: updated });
}
