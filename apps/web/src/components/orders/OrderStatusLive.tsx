"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { BridalStatus } from "@/lib/data/seed";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface Props {
  orderId: string;
  initialStatus: BridalStatus;
  className?: string;
}

export function OrderStatusLive({ orderId, initialStatus, className }: Props) {
  const { ready } = useFirebaseAuth();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const unsub = onSnapshot(doc(db, "live_orders", orderId), (snapshot) => {
      const next = snapshot.data()?.status as BridalStatus | undefined;
      if (next) setStatus(next);
    });

    return () => unsub();
  }, [orderId, ready]);

  return <StatusBadge status={status} className={className} />;
}
