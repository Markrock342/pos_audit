import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getOrganization } from "@/lib/services/db/organizations";
import { buildDrawerKickCommand } from "@/lib/hardware/cashDrawer";
import { dispatchPrintJob } from "@/lib/hardware/printTransport";

export const runtime = "nodejs";

const bodySchema = z.object({
  pin: z.enum(["pin2", "pin5"]).optional(),
  hardwareConfig: z
    .object({
      printerType: z.enum(["none", "lan", "usb", "imin"]).optional(),
      iminConnectType: z.enum(["USB", "SPI", "Bluetooth"]).optional(),
      ip: z.string().optional(),
      port: z.coerce.number().optional(),
      bridgeUrl: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    const pin = parsed.success ? parsed.data.pin : undefined;
    const override = parsed.success ? parsed.data.hardwareConfig : undefined;

    const org = await getOrganization(DEFAULT_ORG_ID);
    const hw = { ...(org?.hardwareConfig ?? {}), ...(override ?? {}) };

    if (hw.printerType === "none" || !hw.ip?.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_CONFIGURED",
            message: "ตั้งค่า IP เครื่องพิมพ์ก่อน — ลิ้นชักเด้งผ่านพอร์ต DK ของเครื่องพิมพ์",
          },
        },
        { status: 400 }
      );
    }

    const kick = buildDrawerKickCommand({ pin: pin ?? hw.drawerPin ?? "pin2" });
    const result = await dispatchPrintJob(hw, kick, 3000);

    return NextResponse.json({
      data: {
        success: true,
        mode: result.mode,
        message: "ส่งคำสั่งเปิดลิ้นชักแล้ว",
      },
    });
  } catch (e) {
    console.error("[hardware/drawer]", e);
    return NextResponse.json(
      {
        error: {
          code: "DRAWER_FAILED",
          message: e instanceof Error ? e.message : "เปิดลิ้นชักไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
