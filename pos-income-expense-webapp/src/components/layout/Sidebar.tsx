"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, APP_NAME } from "@/constants";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { cn } from "@/lib/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const { shopName } = useOrganization();

  return (
    <aside className="flex w-72 flex-col bg-surface-elevated shadow-[2px_0_12px_rgba(15,23,42,0.08)]">
      <div className="border-b border-border-default px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-[0_2px_8px_rgba(255,107,53,0.4)]">
            <span className="text-lg font-black text-text-inverse">บ</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {shopName}
            </p>
            <h1 className="text-lg font-black text-text-main leading-tight">{APP_NAME}</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-5 py-4 text-base font-bold transition-all duration-150 min-h-[60px]",
                isActive
                  ? "bg-brand text-text-inverse shadow-[0_2px_8px_rgba(255,107,53,0.35)]"
                  : "text-text-secondary active:bg-surface-hover active:text-text-main"
              )}
            >
              <item.icon size={24} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-default px-6 py-5 text-sm font-bold text-text-muted">
        v0.1.0 — Swan 2
      </div>
    </aside>
  );
}
