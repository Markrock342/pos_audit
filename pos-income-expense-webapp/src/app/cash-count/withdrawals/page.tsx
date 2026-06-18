import { redirect } from "next/navigation";

export default function CashWithdrawHistoryRedirect() {
  redirect("/settings#cash-movement-history");
}
