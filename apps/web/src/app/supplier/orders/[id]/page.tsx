import {
  getBridalOrderById,
  getBridalOrdersWithRelations,
  getCustomer,
  getOrderFiles,
  getSupplierMessages,
  getTimeline,
} from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { SupplierOrderClient } from "@/components/supplier/SupplierOrderClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierOrderPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.supplierId) redirect("/login");

  const order = await getBridalOrderById(id);
  if (!order || order.supplierId !== session.supplierId) notFound();

  const filesUnlocked = !!order.filesUnlockedAt;
  const [customer, timeline, files, supplierMessages, { orders: otherOrders }] = await Promise.all([
    getCustomer(order.customerId),
    getTimeline(order.id),
    getOrderFiles(order.id, filesUnlocked),
    getSupplierMessages(order.id),
    getBridalOrdersWithRelations({
      supplierId: session.supplierId,
      supplierTab: "in-progress",
      limit: 12,
    }),
  ]);

  return (
    <SupplierOrderClient
      initialOrder={order}
      customerName={customer?.name ?? "Customer"}
      initialFiles={files}
      initialMessages={supplierMessages}
      initialTimeline={timeline}
      otherOrders={otherOrders}
    />
  );
}
