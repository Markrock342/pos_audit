"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchOrganization, updateOrganizationApi } from "@/lib/api/client";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { SHOP_NAME } from "@/constants";

export function ShopSettingsForm() {
  const { refresh: refreshOrg } = useOrganization();
  const [name, setName] = useState(SHOP_NAME);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [openingCash, setOpeningCash] = useState("0");
  const [openingSavings, setOpeningSavings] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const org = await fetchOrganization();
      setName(org.name || SHOP_NAME);
      setAddress(org.address ?? "");
      setPhone(org.phone ?? "");
      setTaxId(org.taxId ?? "");
      setReceiptHeader(org.receiptConfig?.header ?? org.name);
      setReceiptFooter(org.receiptConfig?.footer ?? "");
      setOpeningCash(String(org.financeConfig?.openingCashBalance ?? 0));
      setOpeningSavings(String(org.financeConfig?.openingSavingsBalance ?? 0));
    } catch {
      setMessage("โหลดข้อมูลร้านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      await updateOrganizationApi({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        taxId: taxId.trim() || undefined,
        receiptConfig: {
          header: receiptHeader.trim() || name.trim(),
          footer: receiptFooter.trim() || undefined,
        },
        financeConfig: {
          openingCashBalance: parseFloat(openingCash) || 0,
          openingSavingsBalance: parseFloat(openingSavings) || 0,
          openingBalanceMonth: month,
        },
      });
      setMessage("บันทึกข้อมูลร้านแล้ว");
      await refreshOrg();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-text-muted">กำลังโหลด...</p>;
  }

  return (
    <div className="space-y-4">
      <Input label="ชื่อร้าน" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="เลขประจำตัวผู้เสียภาษี"
        value={taxId}
        onChange={(e) => setTaxId(e.target.value)}
        placeholder="13 หลัก (ถ้ามี)"
      />
      <Input
        label="ที่อยู่"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="ที่อยู่ร้าน (สำหรับใบเสร็จ)"
      />
      <Input
        label="เบอร์โทร"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="0xx-xxx-xxxx"
      />
      <Input
        label="หัวใบเสร็จ"
        value={receiptHeader}
        onChange={(e) => setReceiptHeader(e.target.value)}
      />
      <Input
        label="ท้ายใบเสร็จ"
        value={receiptFooter}
        onChange={(e) => setReceiptFooter(e.target.value)}
        placeholder="ขอบคุณที่ใช้บริการ"
      />

      <div className="border-t border-border-default pt-4">
        <h3 className="mb-1 text-base font-bold text-text-main">ยอดเงินยกมา (ต้นเดือน)</h3>
        <p className="mb-3 text-sm text-text-muted">สำหรับหน้ายอดคงเหลือ ต้นเดือน</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="เงินสดยกมา (บาท)"
            type="number"
            min="0"
            step="0.01"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
          />
          <Input
            label="เงินเก็บ/บัญชียกมา (บาท)"
            type="number"
            min="0"
            step="0.01"
            value={openingSavings}
            onChange={(e) => setOpeningSavings(e.target.value)}
          />
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={saving || !name.trim()}>
        {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลร้าน"}
      </Button>
      {message && (
        <p className={`text-sm font-medium ${message.includes("แล้ว") ? "text-income" : "text-error"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
