import type { ReactNode } from "react";
import { HelpFab } from "@/components/guide/HelpFab";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="main-tablet flex-1 overflow-auto p-3 lg:p-4 2xl:p-6">{children}</main>
        <BottomNav />
        <HelpFab />
      </div>
    </div>
  );
}
