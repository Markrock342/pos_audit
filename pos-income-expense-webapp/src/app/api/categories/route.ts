import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCategories,
  createCategory,
} from "@/lib/services/db/categories";
import type { Category } from "@/types";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

// หมวดหมู่ต้องสดเสมอ — เพิ่ม/แก้แล้วต้องเห็นทันทีในหน้าเพิ่มรายการ
export const dynamic = "force-dynamic";

const postSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(["income", "expense"]),
  color: z.string().min(1).max(7),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as Category["type"] | null;

  const data = await getCategories(DEFAULT_ORG_ID, type ?? undefined);
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
      { status: 400 }
    );
  }

  const newCategory = await createCategory({
    ...parsed.data,
    organizationId: DEFAULT_ORG_ID,
    sortOrder: parsed.data.sortOrder ?? 0,
    isActive: parsed.data.isActive ?? true,
  });

  return NextResponse.json({ data: newCategory }, { status: 201 });
}
