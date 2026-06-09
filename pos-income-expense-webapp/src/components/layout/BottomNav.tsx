"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BOTTOM_NAV_PRIMARY, TABLET_MORE_NAV } from "@/constants";
import { cn } from "@/lib/utils/cn";
import { Grid3X3, X } from "lucide-react";

function isActive(pathname: string, match: string) {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = TABLET_MORE_NAV.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-border-default bg-surface-elevated pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(15,23,42,0.1)] 2xl:hidden"
        aria-label="เมนูหลัก"
      >
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {BOTTOM_NAV_PRIMARY.map((item) => {
            const active = isActive(pathname, item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all active:scale-95",
                  active
                    ? "bg-brand/15 text-brand"
                    : "text-text-secondary active:bg-surface-hover"
                )}
              >
                <item.icon size={26} strokeWidth={active ? 2.5 : 2} />
                <span className="text-xs font-bold leading-tight">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all active:scale-95",
              moreActive || moreOpen
                ? "bg-brand/15 text-brand"
                : "text-text-secondary active:bg-surface-hover"
            )}
            aria-label="เมนูเพิ่มเติม"
          >
            <Grid3X3 size={26} />
            <span className="text-xs font-bold">เพิ่มเติม</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 2xl:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t-2 border-border-default bg-surface-elevated p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-text-main">เมนูเพิ่มเติม</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-hover text-text-muted active:scale-95"
                aria-label="ปิด"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TABLET_MORE_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-[72px] items-center gap-3 rounded-2xl border-2 px-4 py-3 font-bold transition-all active:scale-[0.98]",
                      active
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border-default bg-surface-elevated text-text-main active:bg-surface-hover"
                    )}
                  >
                    <item.icon size={22} />
                    <span className="text-base">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
