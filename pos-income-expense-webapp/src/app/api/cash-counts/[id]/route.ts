import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCashCount,
  updateCashCount,
} from "@/lib/services/db/cashCounts";

const putSchema = z.object({
  openingBalance: z.coerce.number().min(0).optional(),
  actualBalance: z.coerce.number().min(0).optional(),
  countDate: z.string().min(1).optional(),
  note: z.string().max(500).optional(),
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

  const existing = await getCashCount(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Cash count not found" } },
      { status: 404 }
    );
  }

  const updated = await updateCashCount(id, parsed.data);
  return NextResponse.json({ data: updated });
}
