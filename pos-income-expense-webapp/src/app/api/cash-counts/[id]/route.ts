import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCashCount,
  updateCashCount,
} from "@/lib/services/db/cashCounts";
import { isAdminRequest } from "@/lib/api/requestRole";

const putSchema = z.object({
  openingBalance: z.coerce.number().min(0).optional(),
  actualBalance: z.coerce.number().min(0).optional(),
  countDate: z.string().min(1).optional(),
  note: z.string().max(500).optional(),
  updatedBy: z.string().optional(),
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

  const isAdmin = isAdminRequest(request);

  try {
    const updated = await updateCashCount(id, parsed.data, {
      isAdmin,
      updatedBy: parsed.data.updatedBy,
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message.includes("ปิดยอดแล้ว") ? 403 : 400;
    return NextResponse.json(
      { error: { code: status === 403 ? "LOCKED" : "UPDATE_ERROR", message } },
      { status }
    );
  }
}
