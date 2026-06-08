import { NextResponse } from "next/server";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER = KIOSK_ACCOUNTS.find((a) => a.type === "customer");

export async function GET() {
  // MVP: คืน user default จนกว่าจะมี session/cookie จริง
  if (!DEFAULT_USER) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: {
      id: DEFAULT_USER.userId,
      name: DEFAULT_USER.displayName,
      username: DEFAULT_USER.username,
      role: DEFAULT_USER.role,
      organizationId: DEFAULT_USER.organizationId,
    },
  });
}
