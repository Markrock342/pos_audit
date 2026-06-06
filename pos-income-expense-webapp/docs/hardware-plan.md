# Hardware Integration Plan

## อุปกรณ์เป้าหมาย

| อุปกรณ์ | รายละเอียด |
|---------|------------|
| Thermal Printer | 80mm, รองรับ ESC/POS |
| Cash Drawer | เชื่อมผ่าน RJ11 ที่เครื่องพิมพ์ |

## ข้อจำกัดของ Web Browser

Web App ทั่วไป **ไม่สามารถเข้าถึง USB / Serial / Bluetooth โดยตรง** ได้อย่างเสถียรในทุก browser

ทางเลือกในอนาคต:

1. **Local Bridge Service** — Node/Electron app รันบนเครื่อง POS รับคำสั่งจาก Web App ผ่าน WebSocket/HTTP localhost
2. **Electron Wrapper** — ห่อ Web App ด้วย Electron เพื่อเข้าถึง hardware APIs
3. **Network Printer** — ส่ง raw ESC/POS ผ่าน TCP/IP (ต้องมี proxy บนเครื่อง local)

## ESC/POS Commands (อ้างอิง)

| คำสั่ง | ความหมาย |
|--------|----------|
| `ESC @` | Initialize printer |
| `ESC d n` | Feed n lines |
| `GS V` | Cut paper |
| `ESC p m t1 t2` | Kick cash drawer |

Implementation อยู่ใน:

- `/src/lib/hardware/printer.ts`
- `/src/lib/hardware/cashDrawer.ts`

## Cash Drawer (RJ11)

ลิ้นชักเก็บเงินมักเชื่อมกับเครื่องพิมพ์ผ่านสาย RJ11

- ส่ง pulse command ผ่าน printer kick port
- คำสั่งมาตรฐาน: `ESC p 0 50 50` (pin 2, 50ms on/off)

## แผนการพัฒนา

### Phase 1 — Scaffold (ปัจจุบัน)

- [x] สร้าง interface และ placeholder functions
- [x] Receipt template สำหรับ preview
- [x] เอกสารแผน hardware

### Phase 2 — Local Bridge Prototype

- [ ] สร้าง local service รับคำสั่ง print/openDrawer
- [ ] ทดสอบกับเครื่องพิมพ์ 80mm จริง 1 รุ่น
- [ ] ทดสอบ cash drawer ผ่าน RJ11

### Phase 3 — Production Integration

- [ ] Error handling และ retry
- [ ] ตั้งค่า printer ในหน้า Settings
- [ ] Log การพิมพ์และสถานะ drawer

## ข้อควรระวัง

> **ต้องทดสอบกับอุปกรณ์จริงก่อนยืนยัน 100%**

- แต่ละรุ่น printer อาจใช้ command set ต่างกันเล็กน้อย
- Browser security policy อาจเปลี่ยน — Local Bridge เป็นทางเลือกที่ยืดหยุ่นกว่า
- ควรมี fallback: preview + manual print หาก hardware ล้มเหลว

## ไฟล์ที่เกี่ยวข้อง

```
src/lib/hardware/
├── printer.ts      # printReceipt, buildEscPosPayload
└── cashDrawer.ts   # openCashDrawer, buildDrawerKickCommand

src/receipt-templates/
└── default-receipt.tsx
```
