import { redirect } from "next/navigation";

export default function AdminNewProductRedirect() {
  redirect("/admin/content/products/new");
}
