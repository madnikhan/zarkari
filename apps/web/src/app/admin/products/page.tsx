import { redirect } from "next/navigation";

export default function AdminProductsRedirect() {
  redirect("/admin/content/products");
}
