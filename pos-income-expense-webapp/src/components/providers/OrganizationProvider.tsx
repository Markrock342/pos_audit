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
import { fetchOrganization, readOrganizationCache } from "@/lib/api/client";
import { SHOP_NAME } from "@/constants";
import type { Organization } from "@/types";

interface OrganizationContextValue {
  organization: Organization | null;
  shopName: string;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

const PUBLIC_PATHS = ["/login", "/set-password"];

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [organization, setOrganization] = useState<Organization | null>(() =>
    readOrganizationCache()
  );

  const refresh = useCallback(async () => {
    try {
      const org = await fetchOrganization();
      setOrganization(org);
    } catch {
      if (!readOrganizationCache()) {
        setOrganization(null);
      }
    }
  }, []);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;
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
