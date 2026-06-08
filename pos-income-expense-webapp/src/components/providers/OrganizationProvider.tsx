"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchOrganization } from "@/lib/api/client";
import { SHOP_NAME } from "@/constants";
import type { Organization } from "@/types";

interface OrganizationContextValue {
  organization: Organization | null;
  shopName: string;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);

  const refresh = useCallback(async () => {
    try {
      setOrganization(await fetchOrganization());
    } catch {
      setOrganization(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
