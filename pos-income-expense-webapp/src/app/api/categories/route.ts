import { NextResponse } from "next/server";
import {
  getCategories,
  createCategory,
} from "@/lib/services/db/categories";
import type { Category } from "@/types";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as Category["type"] | null;

  const data = await getCategories(DEFAULT_ORG_ID, type ?? undefined);
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCategory = await createCategory({
    ...body,
    organizationId: DEFAULT_ORG_ID,
  });

  return NextResponse.json({ data: newCategory }, { status: 201 });
}
