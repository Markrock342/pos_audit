/** Organization IDs — ลูกค้าและ dev แยก org กัน */
export const ORG_IDS = {
  customer: "11111111-1111-1111-1111-111111111111",
  dev: "22222222-2222-2222-2222-222222222222",
} as const;

/** API default = ข้อมูลลูกค้า (จนกว่า Phase 8 จะอ่าน org จาก session) */
export const DEFAULT_ORG_ID = ORG_IDS.customer;
