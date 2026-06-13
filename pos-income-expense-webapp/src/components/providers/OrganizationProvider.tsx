"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { fetchOrganization } from "@/lib/api/client";
import { SHOP_NAME } from "@/constants";
import type { Organization } from "@/types";

interface OrganizationContextValue {
  organization: Organization | null;
  shopName: string;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

const ORG_CACHE_KEY = "pos-org-cache-v1";
const ORG_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_PATHS = ["/login", "/set-password"];

function readOrgCache(): Organization | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ORG_CACHE_KEY);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw) as { data: Organization; at: number };
    if (Date.now() - at > ORG_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeOrgCache(org: Organization) {
  try {
    sessionStorage.setItem(
      ORG_CACHE_KEY,
      JSON.stringify({ data: org, at: Date.now() })
    );
  } catch {}
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [organization, setOrganization] = useState<Organization | null>(() => readOrgCache());

  const refresh = useCallback(async () => {
    try {
      const org = await fetchOrganization();
      setOrganization(org);
      writeOrgCache(org);
    } catch {
      setOrganization(null);
    }
  }, []);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    const cached = readOrgCache();
    if (cached) {
      setOrganization(cached);
    }

    void refresh();
  }, [pathname, refresh]);

  const shopName = organization?.name ?? SHOP_NAME;

  return (
    <OrganizationContext.Provider value={{ organization, shopName, refresh }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be inside OrganizationProvider");
  return ctx;
}
