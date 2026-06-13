"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";

const PUBLIC_PATHS = ["/login", "/set-password", "/_not-found"];

function AuthLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex h-16 items-center gap-3 border-b border-border-default px-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isReady } = useAuth();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn && !isPublic) {
      router.replace("/login");
    }
    if (isLoggedIn && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [isReady, isLoggedIn, pathname, router, isPublic]);

  if (!isReady) {
    return <AuthLoadingShell />;
  }

  if (!isLoggedIn && !isPublic) {
    return <AuthLoadingShell />;
  }

  return <>{children}</>;
}
