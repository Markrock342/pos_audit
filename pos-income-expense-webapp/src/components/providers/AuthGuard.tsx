"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const PUBLIC_PATHS = ["/login", "/set-password", "/_not-found"];

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-xl font-bold text-text-muted">กำลังโหลด...</p>
      </div>
    );
  }

  if (!isLoggedIn && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-xl font-bold text-text-muted">กำลังโหลด...</p>
      </div>
    );
  }

  return <>{children}</>;
}
