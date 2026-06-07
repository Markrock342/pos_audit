"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  isLoggedIn: boolean;
  isReady: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = "kiosk-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" && localStorage.getItem(AUTH_KEY);
      setIsLoggedIn(!!stored);
    } catch {
      setIsLoggedIn(false);
    }
    setIsReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) {
        setIsLoggedIn(!!e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(() => {
    try {
      localStorage.setItem(AUTH_KEY, "1");
    } catch {}
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem("kiosk-current-user");
    } catch {}
    setIsLoggedIn(false);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
