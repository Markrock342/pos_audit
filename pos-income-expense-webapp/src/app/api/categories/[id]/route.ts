import { NextResponse } from "next/server";
import {
  getCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/services/db/categories";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await getCategory(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Category not found" } },
      { status: 404 }
    );
  }

  const updated = await updateCategory(id, {
    name: body.name,
    type: body.type,
    color: body.color,
    sortOrder: body.sortOrder,
    isActive: body.isActive,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await getCategory(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Category not found" } },
      { status: 404 }
    );
  }

  await deleteCategory(id);
  return NextResponse.json({ data: { success: true } });
}
