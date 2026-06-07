"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import {
  getClientDataSource,
  setClientDataSource,
  type DataSource,
} from "@/lib/dataSource";

export function DatabaseSettings() {
  const router = useRouter();
  const [source, setSource] = useState<DataSource>("supabase");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSource(getClientDataSource());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as DataSource;
    setClientDataSource(next);
    setSource(next);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Select
        label="Database Provider"
        options={[
          { value: "supabase", label: "Supabase (ปัจจุบัน)" },
          { value: "mock", label: "Mock Data (ทดสอบ offline)" },
        ]}
        value={source}
        onChange={handleChange}
      />
      {source === "mock" ? (
        <p className="text-xs font-bold text-income">
          ใช้ข้อมูลตัวอย่างในเครื่อง — ไม่ต้องเชื่อม Supabase (refresh หน้าอื่นแล้วจะเห็นข้อมูล mock)
        </p>
      ) : (
        <p className="text-xs text-text-muted">
          ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local
        </p>
      )}
      {saved && (
        <p className="text-xs font-bold text-brand">บันทึกแล้ว — กำลังโหลดข้อมูลใหม่...</p>
      )}
    </div>
  );
}
