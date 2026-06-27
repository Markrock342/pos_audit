"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PinPadDialog, type PinCompleteResult } from "@/components/settings/PinPadDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  findKioskAccountWithPin,
  getLoginPinEditableAccounts,
  hasCustomLoginPin,
  setLoginPin,
} from "@/lib/auth/kioskPinStorage";
import { KeyRound } from "lucide-react";

type PinMode = "current" | "new" | "confirm" | null;

export function LoginPinSettingsPanel() {
  const { session } = useAuth();
  const editable = getLoginPinEditableAccounts();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>(null);
  const [pendingNewPin, setPendingNewPin] = useState("");
  const [customPin, setCustomPin] = useState(false);

  useEffect(() => {
    const accounts = getLoginPinEditableAccounts();
    const initial =
      accounts.find((a) => a.username === session?.username)?.username ??
      accounts[0]?.username ??
      "";
    setUsername(initial);
  }, [session?.username]);

  useEffect(() => {
    if (username) setCustomPin(hasCustomLoginPin(username));
  }, [username, pinMode, message]);

  const selected = editable.find((a) => a.username === username);

  const closePin = useCallback(() => {
    setPinMode(null);
    setError(null);
    setPendingNewPin("");
  }, []);

  const startChangePin = () => {
    if (!selected) return;
    setMessage(null);
    setError(null);
    setPendingNewPin("");
    setPinMode("current");
  };

  const handlePinComplete = (pin: string): PinCompleteResult => {
    if (!selected) return false;

    if (pinMode === "current") {
      if (!findKioskAccountWithPin(selected.username, pin)) {
        setError("PIN ปัจจุบันไม่ถูกต้อง");
        return false;
      }
      setPendingNewPin("");
      setError(null);
      setPinMode("new");
      return;
    }

    if (pinMode === "new") {
      setPendingNewPin(pin);
      setError(null);
      setPinMode("confirm");
      return;
    }

    if (pinMode === "confirm") {
      if (pin !== pendingNewPin) {
        setError("PIN ใหม่ไม่ตรงกัน — ลองใหม่");
        setPinMode("new");
        setPendingNewPin("");
        return false;
      }
      try {
        setLoginPin(selected.username, pin);
        setCustomPin(true);
        setMessage(`เปลี่ยน PIN ของ ${selected.displayName} แล้ว`);
        closePin();
      } catch (e) {
        setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      }
    }
  };

  const pinTitle =
    pinMode === "current"
      ? "PIN เข้าระบบปัจจุบัน"
      : pinMode === "new"
        ? "ตั้ง PIN ใหม่"
        : pinMode === "confirm"
          ? "ยืนยัน PIN ใหม่"
          : "";

  const pinSubtitle =
    pinMode === "current"
      ? `บัญชี ${selected?.displayName ?? username}`
      : pinMode === "new"
        ? "ตัวเลข 4 หลัก"
        : pinMode === "confirm"
          ? "ใส่ PIN ใหม่อีกครั้ง"
          : undefined;

  if (editable.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        PIN สำหรับเข้าระบบ — เก็บในเครื่องนี้ (แยกจากรหัสเปิดลิ้นชัก)
      </p>

      {editable.length > 1 && (
        <div>
          <label className="mb-1 block text-sm font-bold text-text-secondary">บัญชี</label>
          <select
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border-2 border-border-default bg-surface-elevated px-4 py-3 text-base font-bold text-text-main"
          >
            {editable.map((a) => (
              <option key={a.username} value={a.username}>
                {a.displayName} ({a.username})
              </option>
            ))}
          </select>
        </div>
      )}

      {selected && (
        <div className="rounded-xl bg-surface-inset px-4 py-3">
          <p className="text-sm text-text-muted">บัญชี</p>
          <p className="font-bold text-text-main">
            {selected.displayName}{" "}
            <span className="text-text-muted">({selected.username})</span>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {customPin ? "ตั้ง PIN เองแล้ว" : "ใช้ PIN เริ่มต้น 0000 — แนะนำเปลี่ยนหลังติดตั้ง"}
          </p>
        </div>
      )}

      <Button type="button" variant="outline" className="gap-2" onClick={startChangePin}>
        <KeyRound size={18} />
        เปลี่ยน PIN เข้าระบบ
      </Button>

      {message && <p className="text-sm font-medium text-income">{message}</p>}
      {error && !pinMode && <p className="text-sm font-medium text-error">{error}</p>}

      <PinPadDialog
        key={pinMode ?? "closed"}
        open={pinMode !== null}
        title={pinTitle}
        subtitle={pinSubtitle}
        error={pinMode ? error : null}
        onComplete={handlePinComplete}
        onCancel={closePin}
      />
    </div>
  );
}
