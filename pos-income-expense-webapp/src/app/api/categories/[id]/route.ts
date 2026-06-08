import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/services/db/categories";

const putSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(["income", "expense"]).optional(),
  color: z.string().min(1).max(7).optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = await request.json();
  const parsed = putSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
      { status: 400 }
    );
  }

  const existing = await getCategory(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Category not found" } },
      { status: 404 }
    );
  }

  const updated = await updateCategory(id, parsed.data);
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
