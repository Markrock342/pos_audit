import type { FinanceConfig } from "@/types";

export type DailyResetMode = "full_reset" | "carry_forward";

/** ค่าเริ่มต้น = full_reset (เคลียร์ลิ้นชักทุกเย็น — วันใหม่เริ่มศูนย์) */
export function getDailyResetMode(finance?: FinanceConfig): DailyResetMode {
  return finance?.dailyResetMode === "carry_forward" ? "carry_forward" : "full_reset";
}

export function isFullDailyReset(finance?: FinanceConfig): boolean {
  return getDailyResetMode(finance) === "full_reset";
}
