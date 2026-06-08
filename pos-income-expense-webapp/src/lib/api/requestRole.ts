import type { UserRole } from "@/types";

/** อ่าน role จาก header ที่ client ส่งมา (MVP kiosk session) */
export function getRequestRole(request: Request): UserRole {
  const role = request.headers.get("x-kiosk-role");
  return role === "admin" ? "admin" : "staff";
}

export function isAdminRequest(request: Request): boolean {
  return getRequestRole(request) === "admin";
}
