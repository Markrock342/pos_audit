"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { logout, session } = useAuth();
  const { shopName } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const isHome = pathname === "/dashboard";

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("th-TH", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border-default bg-surface-elevated px-6 shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-4">
        {!isHome && (
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="min-h-[56px]"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft size={24} />
          </Button>
        )}
        <div>
          <p className="text-base font-semibold text-text-secondary">{shopName}</p>
          <h2 className="text-xl font-bold text-text-main">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="block text-2xl font-bold tabular-nums text-text-main tracking-tight">
            {time}
          </span>
          <span className="block text-sm font-bold text-text-muted">
            {date}
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="min-h-[56px]"
          aria-label="เปลี่ยนธีม"
        >
          {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
        </Button>
        <span className="text-lg font-medium text-text-secondary">
          ผู้ใช้: {session?.displayName ?? "—"}
        </span>
        <Button variant="outline" onClick={logout} className="min-h-[56px] gap-2 font-bold">
          ออกจากระบบ
        </Button>
      </div>
    </header>
  );
}
