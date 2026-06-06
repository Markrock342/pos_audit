"use client";

import { SHOP_NAME } from "@/constants";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="เปิดเมนู"
        >
          ☰
        </Button>
        <div>
          <p className="text-xs text-stone-500">{SHOP_NAME}</p>
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-stone-600 sm:inline">ผู้ใช้: Staff</span>
        <Button variant="outline" size="sm">
          ออกจากระบบ
        </Button>
      </div>
    </header>
  );
}
