import type { ReactNode } from "react";
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
    <div className="flex h-dvh overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="main-tablet flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4 2xl:p-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
