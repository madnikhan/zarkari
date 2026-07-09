"use client";

import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";

export function useFirebaseAuth() {
  const [ready, setReady] = useState(!isFirebaseClientConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseClientConfigured()) return;

    let cancelled = false;

    async function signIn() {
      try {
        const res = await fetch("/api/firebase/token", { method: "POST" });
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) setReady(true);
            return;
          }
          throw new Error("Failed to get Firebase token");
        }
        const data = await res.json();
        const auth = getClientAuth();
        if (!auth) throw new Error("Firebase client unavailable");
        await signInWithCustomToken(auth, data.token);
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Firebase auth failed");
          setReady(true);
        }
      }
    }

    signIn();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
