import { parseJsonResponse } from "./parse-json";

export type R2DirectProbeResult =
  | { ok: true; probeKey?: string }
  | { ok: false; reason: "not_configured" | "demo" | "cors" | "etag" | "network" | "presign_failed"; message: string };

const PROBE_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedProbe: { at: number; result: R2DirectProbeResult } | null = null;

export const R2_CORS_USER_MESSAGE =
  "Direct upload to storage is blocked (CORS). Fix the R2 bucket CORS policy — see Admin → Settings → Storage.";

export const R2_ETAG_USER_MESSAGE =
  'Storage CORS must expose the ETag header. Add `"ExposeHeaders": ["ETag"]` on the R2 bucket.';

export const R2_RELAY_PROGRESS_LABEL = "Uploading via server (slower)…";

function putProbeChunk(uploadUrl: string, blob: Blob, timeoutMs: number): Promise<{ etag: string | null; corsBlocked: boolean }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.timeout = timeoutMs;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const raw = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
        if (!raw) {
          resolve({ etag: null, corsBlocked: false });
          return;
        }
        resolve({ etag: raw.replace(/"/g, ""), corsBlocked: false });
        return;
      }
      if (xhr.status === 403 || xhr.status === 0) {
        resolve({ etag: null, corsBlocked: true });
        return;
      }
      resolve({ etag: null, corsBlocked: false });
    };
    xhr.onerror = () => resolve({ etag: null, corsBlocked: true });
    xhr.ontimeout = () => resolve({ etag: null, corsBlocked: false });
    xhr.send(blob);
  });
}

/** Browser-only: presign + PUT probe (CORS + ETag). Result cached briefly per tab session. */
export async function probeDirectR2Upload(options?: { bypassCache?: boolean }): Promise<R2DirectProbeResult> {
  const now = Date.now();
  if (!options?.bypassCache && cachedProbe && now - cachedProbe.at < PROBE_CACHE_TTL_MS) {
    return cachedProbe.result;
  }

  try {
    const res = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: ".cors-probe",
        contentType: "application/octet-stream",
        category: "_probe",
        fileSize: 32,
      }),
    });
    const data = await parseJsonResponse<{ uploadUrl?: string; demo?: boolean; error?: string; key?: string }>(res);
    if (!res.ok) {
      const result: R2DirectProbeResult = {
        ok: false,
        reason: "presign_failed",
        message: data.error ?? `Presign failed (${res.status})`,
      };
      cachedProbe = { at: now, result };
      return result;
    }
    if (data.demo || !data.uploadUrl) {
      const result: R2DirectProbeResult = {
        ok: false,
        reason: data.demo ? "demo" : "not_configured",
        message: data.demo ? "R2 not configured (demo mode)" : "Storage not configured",
      };
      cachedProbe = { at: now, result };
      return result;
    }

    const put = await putProbeChunk(data.uploadUrl, new Blob([new Uint8Array(32)]), 30_000);
    if (put.corsBlocked) {
      const result: R2DirectProbeResult = { ok: false, reason: "cors", message: R2_CORS_USER_MESSAGE };
      cachedProbe = { at: now, result };
      return result;
    }
    if (!put.etag) {
      const result: R2DirectProbeResult = { ok: false, reason: "etag", message: R2_ETAG_USER_MESSAGE };
      cachedProbe = { at: now, result };
      return result;
    }

    const result: R2DirectProbeResult = { ok: true, probeKey: data.key };
    cachedProbe = { at: now, result };

    if (data.key) {
      void fetch("/api/admin/storage/probe-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: data.key }),
      }).catch(() => {});
    }

    return result;
  } catch {
    const result: R2DirectProbeResult = {
      ok: false,
      reason: "network",
      message: "Could not reach upload API — check your connection.",
    };
    cachedProbe = { at: now, result };
    return result;
  }
}

export function invalidateR2DirectProbeCache(): void {
  cachedProbe = null;
}

const STORAGE_CORS_INTERNAL = "__STORAGE_CORS_BLOCKED__";
const STORAGE_ETAG_INTERNAL = "__STORAGE_ETAG_MISSING__";

export function isDirectStorageBlockedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg === STORAGE_CORS_INTERNAL ||
    msg === STORAGE_ETAG_INTERNAL ||
    msg.includes("CORS") ||
    msg.includes("Direct storage upload blocked") ||
    msg.includes("storage CORS") ||
    msg.includes("ETag missing") ||
    msg === R2_CORS_USER_MESSAGE ||
    msg === R2_ETAG_USER_MESSAGE
  );
}
