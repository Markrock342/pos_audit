import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getOrganization } from "@/lib/services/db/organizations";
import {
  escAlign,
  escCenterLines,
  escConcat,
  escCut,
  escFeed,
  escInit,
  escRule,
  escTextLine,
} from "@/lib/hardware/escpos";
import { dispatchPrintJob } from "@/lib/hardware/printTransport";
import type { HardwareConfig } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  hardwareConfig: z
    .object({
      printerType: z.enum(["none", "lan", "usb", "imin"]).optional(),
      ip: z.string().optional(),
      port: z.coerce.number().optional(),
      bridgeUrl: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    const override = parsed.success ? parsed.data.hardwareConfig : undefined;

    const org = await getOrganization(DEFAULT_ORG_ID);
    const hw: HardwareConfig = {
      ...(org?.hardwareConfig ?? {}),
      ...(override ?? {}),
    };

    if (hw.printerType === "none" || hw.printerType === "imin" || !hw.ip?.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_CONFIGURED",
            message: "ตั้งค่า IP เครื่องพิมพ์ก่อน (LAN/USB)",
          },
        },
        { status: 400 }
      );
    }

    const now = new Date().toLocaleString("th-TH", { hour12: false });
    const payload = escConcat([
      escInit(),
      escCenterLines(["ทดสอบพิมพ์", "POS Test Print"], true),
      escRule(),
      escAlign("center"),
      escTextLine(now),
      escTextLine("สำเร็จ — ใช้งานได้"),
      escFeed(3),
      escCut(),
    ]);

    const result = await dispatchPrintJob(hw, payload);

    return NextResponse.json({
      data: {
        success: true,
        mode: result.mode,
        message: "พิมพ์ทดสอบแล้ว",
      },
    });
  } catch (e) {
    console.error("[hardware/test-print]", e);
    return NextResponse.json(
      {
        error: {
          code: "TEST_PRINT_FAILED",
          message: e instanceof Error ? e.message : "พิมพ์ทดสอบไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
