export const DAILY_FLOW_STEPS = [
  { n: 1, text: "เช้า — ใส่ยอดเงินทอน", href: "/cash-count" },
  { n: 2, text: "วัน — บันทึกรายรับ / รายจ่าย (ลิ้นชักเด้ง)", href: "/income/add" },
  { n: 3, text: "เย็น — นับเงินที่นับได้ทั้งหมด", href: "/cash-count" },
] as const;
