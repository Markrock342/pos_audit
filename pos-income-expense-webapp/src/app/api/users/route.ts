import { NextResponse } from "next/server";
import { getUsers } from "@/lib/services/db/users";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  const data = await getUsers(DEFAULT_ORG_ID);
  return NextResponse.json({ data, total: data.length });
}
