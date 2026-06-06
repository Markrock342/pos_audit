import { NextResponse } from "next/server";
import { addCategory, getCategories } from "@/lib/store";
import type { Category } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const data =
    type === "income" || type === "expense"
      ? getCategories(type)
      : getCategories();

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<Category, "id">;
  const newCategory = addCategory(body);

  return NextResponse.json({ data: newCategory }, { status: 201 });
}
