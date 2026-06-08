"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Delete, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  findKioskAccount,
  isHiddenFromProfiles,
  KIOSK_SESSION_KEY,
  toKioskSession,
} from "@/constants/kioskUsers";
import { loginApi } from "@/lib/api/client";

const MAX_PIN = 4;
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"];
const CREDS_KEY = "kiosk-creds";
const CURRENT_USER_KEY = "kiosk-current-user";
const SAVED_PROFILES_KEY = "kiosk-saved-profiles";

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

function getSavedProfiles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function addSavedProfile(username: string) {
  if (isHiddenFromProfiles(username)) return;
  try {
    const profiles = getSavedProfiles();
    if (!profiles.includes(username)) {
      profiles.push(username);
      localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(profiles));
    }
  } catch {}
}

function removeSavedProfile(username: string) {
  try {
    const profiles = getSavedProfiles().filter((u) => u !== username);
    localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(profiles));
  } catch {}
}

export function PinLogin() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : getSavedProfiles()
  );
  const usernameRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfiles(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const trimmedUser = username.trim();
    const users = getStoredUsers();
    let authenticated = false;

    try {
      const session = await loginApi(trimmedUser, pin);
      localStorage.setItem(CURRENT_USER_KEY, trimmedUser);
      localStorage.setItem(KIOSK_SESSION_KEY, JSON.stringify(session));
      authenticated = true;
    } catch {
      const match = users.find((u) => u.username === trimmedUser && u.pin === pin);
      const builtin = findKioskAccount(trimmedUser, pin);
      if (match || builtin) {
        localStorage.setItem(CURRENT_USER_KEY, trimmedUser);
        if (builtin) {
          localStorage.setItem(KIOSK_SESSION_KEY, JSON.stringify(toKioskSession(builtin)));
        } else {
          localStorage.removeItem(KIOSK_SESSION_KEY);
        }
        authenticated = true;
      }
    }

    if (authenticated) {
      setErrorMsg("");
      addSavedProfile(trimmedUser);
      setSavedProfiles(getSavedProfiles());
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
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {/* Saved Profiles Dropdown */}
      {savedProfiles.filter((n) => !isHiddenFromProfiles(n)).length > 0 && (
        <div className="w-full relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowProfiles((p) => !p)}
            className="w-full flex items-center justify-between rounded-2xl border-2 border-border-default bg-surface-elevated py-2 px-4 text-base font-bold text-text-secondary shadow-sm active:scale-[0.98] transition-all duration-150"
          >
            <span>เลือกโปรไฟล์ที่บันทึกไว้ ({savedProfiles.filter((n) => !isHiddenFromProfiles(n)).length})</span>
            <span className={`transition-transform duration-150 ${showProfiles ? "rotate-180" : ""}`}>▼</span>
          </button>
          {showProfiles && (
            <div className="absolute z-20 mt-1 w-full rounded-2xl border-2 border-border-default bg-surface-elevated shadow-lg overflow-hidden">
              {savedProfiles.filter((n) => !isHiddenFromProfiles(n)).map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-4 py-2 hover:bg-surface-hover active:bg-surface-hover cursor-pointer transition-colors"
                >
                  <button
                    type="button"
                    className="flex-1 text-left text-base font-bold text-text-main"
                    onClick={() => {
                      setUsername(name);
                      setErrorMsg("");
                      setShowProfiles(false);
                    }}
                  >
                    {name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSavedProfile(name);
                      setSavedProfiles(getSavedProfiles());
                      if (username === name) setUsername("");
                    }}
                    className="text-text-muted hover:text-danger font-bold text-base px-2"
                    aria-label={`ลบ ${name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Username */}
      <div className="w-full">
        <label className="mb-1 block text-sm font-bold text-text-secondary">
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
          className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated py-2 px-4 text-lg font-bold text-text-main placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring shadow-sm"
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
