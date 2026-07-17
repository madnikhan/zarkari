"use client";

import { useRouter } from "next/navigation";
import type { BridalOrder } from "@/lib/data/seed";
import { BridalOrderEditPanel } from "@/components/admin/BridalOrderEditPanel";

export function BridalOrderEditSection({ order }: { order: BridalOrder }) {
  const router = useRouter();
  return <BridalOrderEditPanel order={order} onUpdated={() => router.refresh()} />;
}
