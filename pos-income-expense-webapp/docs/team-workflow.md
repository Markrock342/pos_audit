# Team Workflow

## สมาชิกทีม (3 คน)

| สมาชิก | บทบาท | ความรับผิดชอบหลัก |
|--------|--------|-------------------|
| **Mark** | System Architect / Lead | Architecture, Hardware Integration, Code Review, ตัดสินใจ technical direction |
| **Frontend Developer** | Frontend | UI Pages, Components, Responsive, UX |
| **Backend Developer** | Backend | API, Database, Reports, Business Logic |

## แบ่งงานตาม Module

### Mark

- ออกแบบ system architecture และ folder structure
- Review PR จาก Frontend และ Backend
- พัฒนา `/lib/hardware` และ Local Bridge prototype
- กำหนดมาตรฐาน commit, branch, และ code style
- ประสานงาน integration ระหว่าง frontend ↔ backend ↔ hardware

### Frontend Developer

| งาน | Path / ไฟล์ |
|-----|-------------|
| Layout (Sidebar, Header) | `src/components/layout/` |
| UI Components | `src/components/ui/` |
| หน้า Dashboard | `src/app/dashboard/` |
| หน้ารายรับ / รายจ่าย | `src/app/income/`, `src/app/expense/` |
| หน้าหมวดหมู่ | `src/app/categories/` |
| หน้ารายงาน + Chart | `src/app/reports/`, `src/components/charts/` |
| หน้าตั้งค่า | `src/app/settings/` |
| Login Page | `src/app/login/` |
| Receipt Preview | `src/components/ReceiptPreview.tsx` |
| Responsive / Mobile | ทุกหน้า |

**Branch แนะนำ:** `feature/frontend-*`

### Backend Developer

| งาน | Path / ไฟล์ |
|-----|-------------|
| Transaction API | `src/app/api/transactions/` |
| Category API | `src/app/api/categories/` |
| Report API | `src/app/api/reports/` |
| Database adapter | `src/lib/db/` |
| Validation schemas | `src/lib/validations/` |
| Types | `src/types/` |
| Mock → Real data migration | `src/data/` |

**Branch แนะนำ:** `feature/backend-*`

## ลำดับการพัฒนาแนะนำ

```
Week 1: Scaffold (เสร็จแล้ว)
  ├── โครงโปรเจกต์ + placeholder UI
  └── Mock API + documentation

Week 2: Core Features
  ├── Frontend: เชื่อมฟอร์มกับ API จริง
  ├── Backend: เลือก DB + implement CRUD
  └── Mark: Review + วางแผน hardware POC

Week 3: Reports + Polish
  ├── Frontend: รายงาน, export, responsive polish
  ├── Backend: report queries, date filters
  └── Mark: Hardware prototype

Week 4: Integration + UAT
  ├── ทดสอบ end-to-end
  ├── Fix bugs
  └── เตรียม deploy
```

## การสื่อสารในทีม

- ใช้ PR description อธิบายสิ่งที่เปลี่ยนและวิธีทดสอบ
- Tag reviewer: Mark สำหรับ PR ที่กระทบ architecture หรือ cross-module
- อัปเดต `docs/` เมื่อ scope หรือ workflow เปลี่ยน

## Definition of Done (แต่ละ task)

- [ ] โค้ดผ่าน `npm run lint`
- [ ] โค้ดผ่าน `npm run build`
- [ ] หน้าที่เกี่ยวข้องเปิดได้ไม่มี error
- [ ] มี PR และได้ review แล้ว
- [ ] อัปเดต docs ถ้าจำเป็น
