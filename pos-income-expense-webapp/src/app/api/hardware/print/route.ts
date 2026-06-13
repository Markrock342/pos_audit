import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getOrganization } from "@/lib/services/db/organizations";
import { buildEscPosReceipt } from "@/lib/hardware/escposReceipt";
import { dispatchPrintJob } from "@/lib/hardware/printTransport";
import type { HardwareConfig } from "@/types";

export const runtime = "nodejs";

const hardwareConfigSchema = z
  .object({
    printerType: z.enum(["none", "lan", "usb"]).optional(),
    ip: z.string().optional(),
    port: z.coerce.number().optional(),
    bridgeUrl: z.string().optional(),
    drawerPin: z.enum(["pin2", "pin5"]).optional(),
  })
  .optional();

const bodySchema = z.object({
  transaction: z.object({
    id: z.string(),
    type: z.enum(["income", "expense"]),
    categoryId: z.string(),
    title: z.string(),
    amount: z.coerce.number(),
    note: z.string().optional(),
    paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
    referenceNo: z.string().optional(),
    transactionDate: z.string(),
    status: z.enum(["active", "void"]),
    isPrinted: z.boolean().optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    lineItems: z
      .array(
        z.object({
          id: z.string(),
          transactionId: z.string(),
          sortOrder: z.coerce.number(),
          title: z.string(),
          quantity: z.coerce.number(),
          unitPrice: z.coerce.number(),
          lineAmount: z.coerce.number(),
          categoryId: z.string(),
        })
      )
      .optional(),
  }),
  receipt: z.object({
    id: z.string(),
    transactionId: z.string(),
    receiptNumber: z.string(),
  }),
  shopName: z.string().optional(),
  footer: z.string().optional(),
  sellerName: z.string().optional(),
  openDrawer: z.boolean().optional(),
  hardwareConfig: hardwareConfigSchema,
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const org = await getOrganization(DEFAULT_ORG_ID);
    const hw: HardwareConfig = {
      ...(org?.hardwareConfig ?? {}),
      ...(parsed.data.hardwareConfig ?? {}),
    };

    if (hw.printerType === "none" || !hw.ip?.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_CONFIGURED",
            message: "ยังไม่ได้ตั้งค่าเครื่องพิมพ์ — ไปที่ ตั้งค่า → อุปกรณ์ POS",
          },
          fallback: "browser",
        },
        { status: 400 }
      );
    }

    const data = buildEscPosReceipt(
      {
        transaction: {
          ...parsed.data.transaction,
          isPrinted: parsed.data.transaction.isPrinted ?? false,
        },
        receipt: parsed.data.receipt,
        shopName: parsed.data.shopName ?? org?.receiptConfig?.header ?? org?.name,
        footer: parsed.data.footer ?? org?.receiptConfig?.footer,
        sellerName: parsed.data.sellerName,
      },
      {
        openDrawer: parsed.data.openDrawer,
        drawerPin: hw.drawerPin ?? "pin2",
      }
    );

    const result = await dispatchPrintJob(hw, data);

    return NextResponse.json({
      data: {
        success: true,
        mode: result.mode,
        message: "พิมพ์ใบเสร็จแล้ว",
      },
    });
  } catch (e) {
    console.error("[hardware/print]", e);
    return NextResponse.json(
      {
        error: {
          code: "PRINT_FAILED",
          message: e instanceof Error ? e.message : "พิมพ์ไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
