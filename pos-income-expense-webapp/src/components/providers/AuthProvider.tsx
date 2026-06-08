"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";

interface AuthContextValue {
  isLoggedIn: boolean;
  isReady: boolean;
  session: KioskSession | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = "kiosk-auth";

function readSession(): KioskSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as KioskSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem(AUTH_KEY);
    } catch {
      return false;
    }
  });
  const [isReady] = useState(true);
  const [session, setSession] = useState<KioskSession | null>(() => readSession());

  useEffect(() => {
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
      setSession(readSession());
    } catch {}
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem("kiosk-current-user");
      localStorage.removeItem(KIOSK_SESSION_KEY);
    } catch {}
    setIsLoggedIn(false);
    setSession(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isReady, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
