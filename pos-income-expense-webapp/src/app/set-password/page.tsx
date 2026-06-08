"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Delete, Save, UserCheck } from "lucide-react";
import { SHOP_NAME } from "@/constants";
import { isBuiltinUsername } from "@/constants/kioskUsers";

const MAX_PIN = 4;
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"];
const CREDS_KEY = "kiosk-creds";

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

function addStoredUser(creds: StoredCreds) {
  try {
    const users = getStoredUsers();
    const filtered = users.filter((u) => u.username !== creds.username);
    filtered.push(creds);
    localStorage.setItem(CREDS_KEY, JSON.stringify(filtered));
  } catch {}
}

function removeStoredUser(username: string) {
  try {
    const users = getStoredUsers();
    const filtered = users.filter((u) => u.username !== username);
    localStorage.setItem(CREDS_KEY, JSON.stringify(filtered));
  } catch {}
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [saved, setSaved] = useState(false);
  const [existingUsers, setExistingUsers] = useState<StoredCreds[]>(() => getStoredUsers());
  const [errorMsg, setErrorMsg] = useState("");

  const handleKey = useCallback(
    (key: string) => {
      const setter = step === 1 ? setPin : setConfirmPin;

      if (key === "backspace") {
        setter((prev) => prev.slice(0, -1));
        return;
      }
      if (key === "clear") {
        setter("");
        return;
      }
      setter((prev) => {
        if (prev.length < MAX_PIN) {
          return prev + key;
        }
        return prev;
      });
    },
    [step]
  );

  const handleNext = () => {
    const trimmed = username.trim();
    if (!trimmed || pin.length !== MAX_PIN) return;

    if (isBuiltinUsername(trimmed)) {
      setErrorMsg(`"${trimmed}" เป็นชื่อระบบ (ลูกค้า/dev) — ใช้ชื่ออื่น`);
      return;
    }

    const duplicate = existingUsers.find((u) => u.username === trimmed);
    if (duplicate) {
      setErrorMsg(`ชื่อผู้ใช้ "${trimmed}" มีอยู่แล้ว — จะถูกแทนที่`);
    } else {
      setErrorMsg("");
    }
    setStep(2);
  };

  const handleSave = () => {
    if (pin === confirmPin && pin.length === MAX_PIN) {
      addStoredUser({ username: username.trim(), pin });
      setSaved(true);
      setTimeout(() => router.push("/login"), 1200);
    }
  };

  const handleDeleteUser = (name: string) => {
    removeStoredUser(name);
    setExistingUsers(getStoredUsers());
  };

  const currentPin = step === 1 ? pin : confirmPin;
  const canProceed = step === 1
    ? username.trim() && pin.length === MAX_PIN
    : confirmPin.length === MAX_PIN;

  const isMatch = step === 2 && confirmPin.length === MAX_PIN && pin === confirmPin;
  const isMismatch = step === 2 && confirmPin.length === MAX_PIN && pin !== confirmPin;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
      {/* Header */}
      <div className="mb-6 flex w-full max-w-md items-center gap-3">
        <button
          onClick={() => router.push("/login")}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-text-secondary shadow-sm active:scale-[0.97]"
          aria-label="กลับ"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <p className="text-sm font-bold text-text-muted">{SHOP_NAME}</p>
          <h1 className="text-2xl font-black text-text-main">ตั้งค่ารหัสผ่าน</h1>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="mb-6 flex gap-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-brand" : "bg-border-default"}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-brand" : "bg-border-default"}`} />
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-success/10 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success">
              <Save size={32} className="text-text-inverse" />
            </div>
            <p className="text-xl font-black text-success">บันทึกสำเร็จ!</p>
            <p className="text-base font-bold text-text-secondary">กลับไปหน้าเข้าสู่ระบบ...</p>
          </div>
        ) : (
          <>
            {/* Existing Users */}
            {existingUsers.length > 0 && (
              <div className="mb-4 rounded-2xl border-2 border-border-default bg-surface-elevated p-4">
                <p className="mb-2 text-sm font-bold text-text-muted">ผู้ใช้ที่มีอยู่ ({existingUsers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {existingUsers.map((u) => (
                    <span
                      key={u.username}
                      className="inline-flex items-center gap-2 rounded-xl bg-surface-inset px-3 py-1.5 text-sm font-bold text-text-secondary"
                    >
                      {u.username}
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.username)}
                        className="text-text-muted hover:text-danger"
                        aria-label={`ลบ ${u.username}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Username (step 1 only) */}
            {step === 1 && (
              <div className="mb-4 w-full">
                <label className="mb-2 block text-lg font-bold text-text-secondary">
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="ชื่อพนักงาน"
                  className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated py-4 px-5 text-xl font-bold text-text-main placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring shadow-sm"
                />
                {errorMsg && (
                  <p className="mt-2 text-sm font-bold text-brand">{errorMsg}</p>
                )}
              </div>
            )}

            {/* PIN Label */}
            <div className="mb-4 text-center">
              <p className="text-base font-bold text-text-muted">
                {step === 1 ? "ตั้งรหัส PIN 4 หลัก" : "ยืนยัน PIN อีกครั้ง"}
              </p>
              {isMatch && (
                <p className="mt-1 text-sm font-bold text-success">PIN ตรงกัน</p>
              )}
              {isMismatch && (
                <p className="mt-1 text-sm font-bold text-danger">PIN ไม่ตรงกัน</p>
              )}
            </div>

            {/* PIN Dots */}
            <div className="mb-6 flex items-center justify-center gap-5">
              {Array.from({ length: MAX_PIN }).map((_, i) => {
                const filled = i < currentPin.length;
                const dotColor = isMismatch
                  ? "bg-danger border-danger"
                  : isMatch
                    ? "bg-success border-success"
                    : "bg-brand border-brand";
                return (
                  <div
                    key={i}
                    className={`h-5 w-5 rounded-full border-3 transition-all duration-150 ${
                      filled
                        ? `${dotColor} shadow-[0_0_8px_rgba(255,107,53,0.5)]`
                        : "border-border-default bg-transparent"
                    }`}
                  />
                );
              })}
            </div>

            {/* Numpad */}
            <div className="grid w-full grid-cols-3 gap-4">
              {PIN_KEYS.map((key) => {
                if (key === "backspace") {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      className="flex h-20 min-h-[80px] items-center justify-center rounded-2xl bg-surface-elevated text-text-secondary shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:bg-surface-hover active:scale-[0.97] transition-all duration-150"
                      aria-label="ลบ"
                    >
                      <Delete size={28} />
                    </button>
                  );
                }
                if (key === "clear") {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      className="flex h-20 min-h-[80px] items-center justify-center rounded-2xl bg-surface-elevated text-text-muted text-base font-bold shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:bg-surface-hover active:scale-[0.97] transition-all duration-150"
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
                    className="flex h-20 min-h-[80px] items-center justify-center rounded-2xl bg-surface-elevated text-text-main text-3xl font-black shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:bg-brand active:text-text-inverse active:shadow-[0_4px_12px_rgba(255,107,53,0.35)] active:scale-[0.97] transition-all duration-150"
                    aria-label={key}
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Action Button */}
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="mt-4 w-full flex items-center justify-center gap-3 rounded-2xl bg-brand py-5 text-xl font-black text-text-inverse shadow-[0_2px_8px_rgba(255,107,53,0.35)] active:shadow-[0_4px_12px_rgba(255,107,53,0.45)] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 transition-all duration-150"
              >
                <UserCheck size={24} />
                ถัดไป
              </button>
            ) : (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setConfirmPin(""); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-border-default bg-surface py-4 text-lg font-bold text-text-secondary active:scale-[0.97] transition-all duration-150"
                >
                  <ArrowLeft size={20} />
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canProceed || pin !== confirmPin}
                  className="flex-[2] flex items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-xl font-black text-text-inverse shadow-[0_2px_8px_rgba(255,107,53,0.35)] active:shadow-[0_4px_12px_rgba(255,107,53,0.45)] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 transition-all duration-150"
                >
                  <Save size={24} />
                  บันทึก
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
