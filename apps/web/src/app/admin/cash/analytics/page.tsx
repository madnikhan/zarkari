import { redirect } from "next/navigation";

export default function CashAnalyticsRedirectPage() {
  redirect("/admin/reports?tab=cash");
}
