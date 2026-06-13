"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, APP_NAME } from "@/constants";
import { AppLogo } from "@/components/ui/AppLogo";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { cn } from "@/lib/utils/cn";

export function Sidebar() {
  const pathname = usePathname();
  const { shopName } = useOrganization();

  return (
    <aside className="pos-kiosk-sidebar hidden w-72 shrink-0 flex-col bg-surface-elevated shadow-[2px_0_12px_rgba(15,23,42,0.08)] 2xl:flex">
      <div className="border-b border-border-default px-4 py-4 2xl:px-5 2xl:py-5">
        <div className="flex items-center gap-2.5">
          <AppLogo size={40} className="shadow-[0_2px_8px_rgba(255,107,53,0.4)]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {shopName}
            </p>
            <h1 className="text-lg font-black text-text-main leading-tight">{APP_NAME}</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-150",
                      isActive
                        ? "bg-brand text-text-inverse shadow-[0_2px_8px_rgba(255,107,53,0.35)]"
                        : "text-text-secondary active:bg-surface-hover active:text-text-main"
                    )}
                  >
                    <item.icon size={22} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-bold leading-tight">{item.label}</p>
                      <p
                        className={cn(
                          "truncate text-xs font-medium",
                          isActive ? "text-text-inverse/80" : "text-text-muted"
                        )}
                      >
                        {item.hint}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border-default px-6 py-5 text-sm font-bold text-text-muted">
        v0.1.0 — Swan 2
      </div>
    </aside>
  );
}
