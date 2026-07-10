import { redirect } from "next/navigation";

export default function RetailOrdersRedirect() {
  redirect("/admin/orders?type=online&tab=shop-open");
}
