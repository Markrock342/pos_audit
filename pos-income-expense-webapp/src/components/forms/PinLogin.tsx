"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Delete, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const MAX_PIN = 4;
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"];
const CREDS_KEY = "kiosk-creds";
const CURRENT_USER_KEY = "kiosk-current-user";

interface StoredCreds {
  username: string;
  pin: string;
}

function getStoredUsers(): StoredCreds[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (u): u is StoredCreds =>
          typeof u === "object" &&
          u !== null &&
          typeof u.username === "string" &&
          typeof u.pin === "string"
      );
    }
    // backward-compat: single object
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.username === "string" &&
      typeof parsed.pin === "string"
    ) {
      return [parsed as StoredCreds];
    }
    return [];
  } catch {
    return [];
  }
}

export function PinLogin() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKey = useCallback(
    (key: string) => {
      setErrorMsg("");
      if (key === "backspace") {
        setPin((prev) => prev.slice(0, -1));
        return;
      }
      if (key === "clear") {
        setPin("");
        return;
      }
      setPin((prev) => {
        if (prev.length < MAX_PIN) {
          return prev + key;
        }
        return prev;
      });
    },
    []
  );

  const handleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);

    const trimmedUser = username.trim();

    // hardcoded admin backdoor
    const isAdmin = trimmedUser === "lcs" && pin === "5689";

    const users = getStoredUsers();
    const match = users.find(
      (u) => u.username === trimmedUser && u.pin === pin
    );

    // fallback: no users set up yet
    const fallbackValid = users.length === 0 && trimmedUser && pin === "1234";

    if (isAdmin || match || fallbackValid) {
      setErrorMsg("");
      try {
        localStorage.setItem(CURRENT_USER_KEY, trimmedUser);
      } catch {}
      login();
    } else {
      if (users.length === 0) {
        setErrorMsg("ยังไม่มีรหัสผ่าน — กด \"ตั้งค่ารหัสผ่าน\" ด้านล่าง");
      } else {
        const userExists = users.some((u) => u.username === trimmedUser);
        if (!userExists) {
          setErrorMsg("ชื่อผู้ใช้ไม่ถูกต้อง");
        } else {
          setErrorMsg("PIN ไม่ถูกต้อง");
        }
      }
      triggerShake();
      setPin("");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      {/* Username */}
      <div className="w-full">
        <label className="mb-1.5 block text-base font-bold text-text-secondary">
          ชื่อผู้ใช้
        </label>
        <input
          ref={usernameRef}
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setErrorMsg("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (username.trim() && pin.length === MAX_PIN && !isLoading) {
                handleLogin();
              }
            }
          }}
          placeholder="ชื่อพนักงาน"
          className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated py-3 px-4 text-lg font-bold text-text-main placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring shadow-sm"
        />
      </div>

      {/* PIN Label + Dots */}
      <div className="text-center">
        <p className="text-sm font-bold text-text-muted">รหัส PIN 4 หลัก</p>
        <div className={`flex items-center justify-center gap-4 mt-2 ${shake ? "animate-shake" : ""}`}>
          {Array.from({ length: MAX_PIN }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                  filled
                    ? "bg-brand border-brand shadow-[0_0_8px_rgba(255,107,53,0.5)]"
                    : "border-border-default bg-transparent"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <p className="text-center text-sm font-bold text-[#EF4444]">
          {errorMsg}
        </p>
      )}

      {/* Numpad */}
      <div className="grid w-full grid-cols-3 gap-3">
        {PIN_KEYS.map((key) => {
          if (key === "backspace") {
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                className="flex h-16 items-center justify-center rounded-2xl bg-surface-elevated text-text-secondary shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:bg-surface-hover active:scale-[0.97] transition-all duration-150"
                aria-label="ลบ"
              >
                <Delete size={24} />
              </button>
            );
          }

          if (key === "clear") {
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                className="flex h-16 items-center justify-center rounded-2xl bg-surface-elevated text-text-muted text-base font-bold shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:bg-surface-hover active:scale-[0.97] transition-all duration-150"
                aria-label="ล้าง"
              >
                C
              </button>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="flex h-16 items-center justify-center rounded-2xl bg-surface-elevated text-text-main text-2xl font-black shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:bg-brand active:text-text-inverse active:shadow-[0_4px_12px_rgba(255,107,53,0.35)] active:scale-[0.97] transition-all duration-150"
              aria-label={key}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Login Button */}
      <button
        type="button"
        onClick={handleLogin}
        disabled={!username.trim() || pin.length !== MAX_PIN || isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-lg font-black text-text-inverse shadow-[0_2px_8px_rgba(255,107,53,0.35)] active:shadow-[0_4px_12px_rgba(255,107,53,0.45)] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 transition-all duration-150"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            กำลังเข้าสู่ระบบ...
          </>
        ) : (
          <>เข้าสู่ระบบ</>
        )}
      </button>

      {/* Set Password Link */}
      <a
        href="/set-password"
        className="text-sm font-bold text-text-muted underline underline-offset-4 active:text-brand transition-colors duration-150"
      >
        ตั้งค่ารหัสผ่าน
      </a>
    </div>
  );
}
