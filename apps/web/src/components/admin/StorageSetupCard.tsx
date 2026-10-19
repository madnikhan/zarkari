"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";
import {
  probeDirectR2Upload,
  type R2DirectProbeResult,
  R2_CORS_USER_MESSAGE,
  R2_ETAG_USER_MESSAGE,
} from "@/lib/upload/r2-direct-probe";

type EnvStatus = {
  configured: boolean;
  bucket: string | null;
  publicUrlSet: boolean;
  credentialsOk: boolean | null;
  credentialsError: string | null;
};

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
    >
      {label}
    </div>
  );
}

export function StorageSetupCard() {
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const [probe, setProbe] = useState<R2DirectProbeResult | null>(null);
  const [loadingEnv, setLoadingEnv] = useState(true);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnv = useCallback(async () => {
    setLoadingEnv(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/storage/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load storage status");
      setEnv(data.env as EnvStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load storage status");
    } finally {
      setLoadingEnv(false);
    }
  }, []);

  const runProbe = useCallback(async () => {
    setProbing(true);
    setError(null);
    try {
      const result = await probeDirectR2Upload({ bypassCache: true });
      setProbe(result);
    } finally {
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    void loadEnv();
  }, [loadEnv]);

  useEffect(() => {
    if (env?.configured && env.credentialsOk) {
      void runProbe();
    }
  }, [env?.configured, env?.credentialsOk, runProbe]);

  const corsOk = probe?.ok === true;
  const etagOk = probe?.ok === true;
  const probeFailed = probe && !probe.ok;

  return (
    <div className="boms-card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Cloudflare R2 storage</h2>
        <button
          type="button"
          onClick={() => {
            void loadEnv();
            void runProbe();
          }}
          disabled={loadingEnv || probing}
          className="inline-flex items-center gap-1 text-sm text-[#4C3BCF] hover:underline disabled:opacity-50"
        >
          {probing || loadingEnv ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Large videos and files upload directly from the browser to R2. If CORS is wrong, uploads fall back to a slow
        server relay through Vercel.
      </p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loadingEnv && !env ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : env ? (
        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          <StatusPill ok={env.configured} label={env.configured ? "R2 env vars set" : "R2 env vars missing"} />
          <StatusPill ok={env.publicUrlSet} label={env.publicUrlSet ? "R2_PUBLIC_URL set" : "R2_PUBLIC_URL missing"} />
          <StatusPill
            ok={env.credentialsOk === true}
            label={
              env.credentialsOk === true
                ? `Bucket access OK${env.bucket ? ` (${env.bucket})` : ""}`
                : env.credentialsOk === false
                  ? "Bucket access failed"
                  : "Bucket access — not configured"
            }
          />
          <StatusPill
            ok={corsOk}
            label={
              probing
                ? "Testing browser → R2…"
                : corsOk
                  ? "Browser direct upload OK"
                  : probeFailed && probe.reason === "cors"
                    ? "CORS blocked"
                    : probeFailed && probe.reason === "etag"
                      ? "ETag not exposed"
                      : "Browser direct upload — run test"
            }
          />
        </div>
      ) : null}

      {env?.credentialsError && (
        <p className="text-xs text-red-600 mb-3">{env.credentialsError}</p>
      )}

      {probeFailed && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mb-4">{probe.message}</p>
      )}

      <ul className="space-y-2 text-sm mb-4">
        <li className="flex items-start gap-2">
          {env?.configured ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
          )}
          <span>Set R2_* env vars on Vercel (see repo <code className="text-xs bg-slate-100 px-1">.env.example</code>)</span>
        </li>
        <li className="flex items-start gap-2">
          {corsOk && etagOk ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
          )}
          <span>
            Cloudflare R2 bucket → Settings → CORS: allow{" "}
            <code className="text-xs bg-slate-100 px-1">https://www.zarkari.co.uk</code>, methods GET/PUT/HEAD,{" "}
            <code className="text-xs bg-slate-100 px-1">ExposeHeaders: ETag</code>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Circle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
          <span>
            After fixing CORS, upload a &gt;10 MB video and confirm Network shows{" "}
            <code className="text-xs bg-slate-100 px-1">PUT</code> to{" "}
            <code className="text-xs bg-slate-100 px-1">r2.cloudflarestorage.com</code> with status 200
          </span>
        </li>
      </ul>

      <p className="text-xs text-slate-400">
        Common errors: {R2_CORS_USER_MESSAGE.slice(0, 60)}… · {R2_ETAG_USER_MESSAGE.slice(0, 50)}…
      </p>
    </div>
  );
}
