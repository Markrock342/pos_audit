"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
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
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-surface-elevated px-4 shadow-[0_1px_6px_rgba(15,23,42,0.06)] 2xl:h-20 2xl:px-6">
      <div className="flex min-w-0 items-center gap-2 2xl:gap-4">
        {!isHome && (
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="min-h-[48px] min-w-[48px] shrink-0 px-2 2xl:min-h-[56px]"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft size={24} />
          </Button>
        )}
        <div className="min-w-0">
          <p className="hidden truncate text-sm font-semibold text-text-secondary 2xl:block">
            {shopName}
          </p>
          <h2 className="truncate text-lg font-bold text-text-main 2xl:text-xl">{title}</h2>
          {subtitle && (
            <p className="truncate text-xs font-medium text-text-muted 2xl:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 2xl:gap-4">
        <div className="text-right">
          <span className="block text-xl font-bold tabular-nums text-text-main 2xl:text-2xl">
            {time}
          </span>
          <span className="hidden text-sm font-bold text-text-muted 2xl:block">{date}</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="min-h-[48px] min-w-[48px] px-2 2xl:min-h-[56px]"
          aria-label="เปลี่ยนธีม"
        >
          {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        </Button>
        <span className="hidden max-w-[8rem] truncate text-base font-medium text-text-secondary lg:inline 2xl:max-w-none 2xl:text-lg">
          {session?.displayName ?? "—"}
        </span>
        <Button
          variant="outline"
          onClick={logout}
          className="min-h-[48px] gap-1 px-3 text-sm font-bold 2xl:min-h-[56px] 2xl:gap-2 2xl:px-4 2xl:text-base"
          aria-label="ออกจากระบบ"
        >
          <LogOut size={20} className="2xl:hidden" />
          <span className="hidden 2xl:inline">ออกจากระบบ</span>
          <span className="2xl:hidden">ออก</span>
        </Button>
      </div>
    </header>
  );
}
