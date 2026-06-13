"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/ui/Skeleton";

export const IncomeExpenseChart = dynamic(
  () =>
    import("@/components/charts/IncomeExpenseChart").then((m) => m.IncomeExpenseChart),
  {
    ssr: false,
    loading: () => <SkeletonChart />,
  }
);
