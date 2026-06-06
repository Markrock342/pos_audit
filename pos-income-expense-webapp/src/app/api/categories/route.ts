import { NextResponse } from "next/server";
import { mockCategories } from "@/data/mock";
import type { Category } from "@/types";

let categories = [...mockCategories];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const data =
    type === "income" || type === "expense"
      ? categories.filter((c) => c.type === type)
      : categories;

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<Category, "id">;

  const newCategory: Category = {
    ...body,
    id: `cat-${Date.now()}`,
  };

  categories = [...categories, newCategory];

  return NextResponse.json({ data: newCategory }, { status: 201 });
}
