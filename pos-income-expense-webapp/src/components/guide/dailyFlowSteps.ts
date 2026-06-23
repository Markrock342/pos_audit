export const DAILY_FLOW_STEPS = [
  { n: 1, text: "เช้า — ฝากเงินสด", href: "/cash-count?tab=movement" },
  { n: 2, text: "วัน — บันทึกรายรับ / รายจ่าย (ลิ้นชักเด้ง)", href: "/income/add" },
  { n: 3, text: "เย็น — ถอนเงินหมด แล้วปิดยอด", href: "/cash-count" },
] as const;
