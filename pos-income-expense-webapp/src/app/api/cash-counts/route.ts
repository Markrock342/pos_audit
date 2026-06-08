import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCashCounts,
  createCashCount,
} from "@/lib/services/db/cashCounts";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const postSchema = z.object({
  countDate: z.string().min(1),
  openingBalance: z.coerce.number().min(0),
  actualBalance: z.coerce.number().min(0),
  note: z.string().max(500).optional(),
  countedBy: z.string().optional(),
});

export async function GET() {
  const data = await getCashCounts(DEFAULT_ORG_ID);
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

  const body = parsed.data;
  const newCashCount = await createCashCount({
    organizationId: DEFAULT_ORG_ID,
    countedBy: body.countedBy ?? DEFAULT_USER_ID,
    countDate: body.countDate,
    openingBalance: body.openingBalance,
    actualBalance: body.actualBalance,
    note: body.note,
  });

  return NextResponse.json({ data: newCashCount }, { status: 201 });
}
