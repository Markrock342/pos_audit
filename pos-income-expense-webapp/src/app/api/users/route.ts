import { NextResponse } from "next/server";
import { getUsers } from "@/lib/services/db/users";

const DEFAULT_ORG_ID = "default-org"; // MVP: single organization

export async function GET() {
  const data = await getUsers(DEFAULT_ORG_ID);
  return NextResponse.json({ data, total: data.length });
}
