# Hardware Integration Plan

## อุปกรณ์เป้าหมาย

| อุปกรณ์ | รายละเอียด |
|---------|------------|
| Thermal Printer | 80mm, รองรับ ESC/POS, USB หรือ LAN |
| Cash Drawer | ต่อช่อง **DK (Drawer Kick)** ที่เครื่องพิมพ์ ผ่านสาย **RJ11 หรือ RJ12** |
| Client | Android Tablet — ติดตั้งเว็บเป็น **PWA** (Add to Home screen) |

## สถาปัตยกรรม (Tablet + Printer + ลิ้นชัก)

```
Android Tablet (PWA)
    │  HTTP (Wi‑Fi LAN)
    ▼
Local Bridge (Node.js บน tablet / PC ในร้าน)
    │  TCP :9100 หรือ USB
    ▼
Thermal Printer (ESC/POS)
    │  DK port — สาย RJ11 / RJ12
    ▼
Cash Drawer
```

**สำคัญ:** Tablet **ไม่ต่อ** RJ12 โดยตรง — สายลิ้นชักต่อที่ **เครื่องพิมพ์** เท่านั้น

## PWA (Progressive Web App)

- Deploy Web App บน HTTPS (เช่น Vercel)
- ผู้ใช้เปิด Chrome บน Android → **ติดตั้งแอป** / Add to Home screen
- เปิดเต็มจอเหมือนแอป ไม่ต้องลง Play Store
- การพิมพ์/ลิ้นชักยังต้องผ่าน **Local Bridge** (PWA คุย USB โดยตรงไม่ได้)

## ข้อจำกัดของ Web Browser

Web App / PWA **ไม่สามารถเข้าถึง USB / Serial โดยตรง** ได้อย่างเสถียร

ทางเลือก:

1. **Local Bridge** — Node app รับคำสั่งจาก PWA ผ่าน `http://192.168.x.x:9101`
2. **Network Printer** — Bridge ส่ง raw ESC/POS ไป `printer-ip:9100`
3. **Electron / Capacitor** — ทางเลือกอนาคตถ้าต้องการแอป native บน tablet

## ESC/POS Commands (อ้างอิง)

| คำสั่ง | ความหมาย |
|--------|----------|
| `ESC @` | Initialize printer |
| `ESC d n` | Feed n lines |
| `GS V` | Cut paper |
| `ESC p m t1 t2` | Kick cash drawer |

Implementation:

- `src/lib/hardware/printer.ts`
- `src/lib/hardware/cashDrawer.ts`

## Cash Drawer — RJ11 / RJ12

| ประเภท | ขา | หมายเหตุ |
|--------|-----|----------|
| RJ11 | 6P4C (4 ขาใช้งาน) | พบบ่อยในร้านค้า |
| RJ12 | 6P6C (6 ขาใช้งาน) | **ลูกค้าใช้รุ่นนี้** — เสียบช่อง DK ที่ printer ได้เหมือนกัน |

คำสั่งเด้งลิ้นชัก (เหมือนกันทั้ง RJ11/RJ12):

```
ESC p m t1 t2
```

| `m` | ความหมาย |
|-----|----------|
| `0` | Pulse ไป **pin 2** (ลองก่อน) |
| `1` | Pulse ไป **pin 5** (ถ้า pin 2 ไม่เด้ง — บางลิ้นชัก RJ12) |

ตัวอย่าง byte (pin 2, 50ms on/off):

```
1B 70 00 32 32
```

ตั้งค่า pin ได้ในหน้า **ตั้งค่า → อุปกรณ์ POS** และใน `buildDrawerKickCommand({ pin: "pin2" | "pin5" })`

### ขั้นตอนทดสอบเมื่อของมาถึง

1. ต่อลิ้นชัก RJ12 → ช่อง DK ที่เครื่องพิมพ์
2. กด **ทดสอบลิ้นชัก** ในหน้าตั้งค่า (pin 2)
3. ถ้าไม่เด้ง → เปลี่ยนเป็น pin 5 แล้วทดสอบใหม่
4. ทดสอบพิมพ์ใบเสร็จ + เด้งลิ้นชักหลังบันทึกรายรับเงินสด

## แผนการพัฒนา

### Phase 1 — Scaffold (ปัจจุบัน)

- [x] Interface และ placeholder functions
- [x] Receipt template สำหรับ preview
- [x] รองรับ RJ11/RJ12 + เลือก pin 2 / pin 5 ในโค้ดและ Settings
- [x] เอกสารแผน hardware + PWA

### Phase 2 — Local Bridge + PWA

- [ ] ตั้งค่า PWA (manifest, icons, service worker)
- [ ] สร้าง `hardware-bridge/` รับ print / drawer
- [ ] ทดสอบกับเครื่องพิมพ์ 80mm จริง
- [ ] ทดสอบลิ้นชัก RJ12 (pin 2 แล้ว pin 5)

### Phase 3 — Production

- [ ] Error handling และ retry
- [ ] บันทึก log การพิมพ์
- [ ] Flow บันทึกรายรับ → พิมพ์ → เด้งลิ้นชักอัตโนมัติ

## ข้อควรระวัง

> **ต้องทดสอบกับอุปกรณ์จริงก่อนยืนยัน 100%**

- แต่ละรุ่น printer / ลิ้นชัก อาจใช้ pin ต่างกัน
- ค่าอุปกรณ์แยกจากค่าพัฒนา Web App
- Fallback: แสดง preview ใบเสร็จบนจอ หากพิมพ์ไม่สำเร็จ

## ไฟล์ที่เกี่ยวข้อง

```
src/lib/hardware/
├── printer.ts
└── cashDrawer.ts      # buildDrawerKickCommand({ pin: "pin2" | "pin5" })

src/app/settings/page.tsx   # ตั้งค่า connector + drawer pin

src/receipt-templates/
└── default-receipt.tsx
```
