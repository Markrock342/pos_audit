import { getBusinessToday } from "@/lib/utils/businessDate";

/** วันแรกของเดือนธุรกิจปัจจุบัน (YYYY-MM-01) */
export function getReportDefaultStartDate(): string {
  const today = getBusinessToday();
  return `${today.slice(0, 7)}-01`;
}

/** วันนี้ตาม business date (Asia/Bangkok) */
export function getReportDefaultEndDate(): string {
  return getBusinessToday();
}
