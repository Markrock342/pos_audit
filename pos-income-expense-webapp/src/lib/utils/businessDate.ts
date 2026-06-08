/** วันที่ทำการ (business date) ตาม timezone ร้าน — ค่าเริ่มต้น Asia/Bangkok */

export const BUSINESS_TIMEZONE = "Asia/Bangkok";

/** YYYY-MM-DD ตามเวลาไทย */
export function getBusinessToday(timeZone = BUSINESS_TIMEZONE): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

/** เลื่อนวันที่ YYYY-MM-DD ตามจำนวนวัน */
export function shiftBusinessDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return utc.toISOString().slice(0, 10);
}

export function getBusinessYesterday(today = getBusinessToday()): string {
  return shiftBusinessDate(today, -1);
}

export function isPastBusinessDate(dateStr: string, today = getBusinessToday()): boolean {
  return dateStr < today;
}
