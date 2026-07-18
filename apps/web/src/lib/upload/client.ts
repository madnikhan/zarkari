import {
  MAX_DIRECT_UPLOAD_BYTES,
  MAX_SERVER_UPLOAD_BYTES,
  MULTIPART_CHUNK_BYTES,
  MULTIPART_SLOW_CONCURRENCY,
  MULTIPART_UPLOAD_CONCURRENCY,
  PARALLEL_MULTIPART_THRESHOLD_BYTES,
  SLOW_UPLOAD_THRESHOLD_BPS,
  UPLOAD_PART_MAX_RETRIES,
  UPLOAD_PART_RETRY_DELAYS_MS,
  UPLOAD_SINGLE_PUT_TIMEOUT_MS,
  ADAPTIVE_SPEED_CHECK_MS,
  partUploadTimeoutMs,
  SERVER_RELAY_CHUNK_BYTES,
} from "./constants";
import { isVideoFile, resolveFileMime, withResolvedMime } from "./mime";
import { parseJsonResponse, parseXhrJson } from "./parse-json";
import { formatBytes, UploadSpeedTracker } from "./upload-speed";

const CORS_ERROR_MESSAGE =
  "Direct storage upload blocked (CORS). Retrying via server…";
const ETAG_ERROR_MESSAGE =
  "Upload succeeded but ETag missing — add ETag to R2 CORS ExposeHeaders.";

export type UploadProgressStatus = "uploading" | "processing" | "done" | "error";

export interface UploadProgressState {
  label: string;
  progress: number;
  status: UploadProgressStatus;
  error?: string;
  bytesLoaded?: number;
  bytesTotal?: number;
  speedBps?: number;
  etaSec?: number;
}

type ProgressCallback = (state: UploadProgressState) => void;

export interface UploadResult {
  url: string;
  fileName: string;
  mimeType?: string;
  keepLocal?: boolean;
}

class UploadConcurrencyLimiter {
  private max: number;
  private active = 0;
  private waiters: (() => void)[] = [];

  constructor(initialMax: number) {
    this.max = initialMax;
  }

  setMax(n: number) {
    this.max = Math.max(1, n);
    while (this.active < this.max && this.waiters.length > 0) {
      this.waiters.shift()?.();
    }
  }

  async acquire(): Promise<void> {
    while (this.active >= this.max) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    this.active++;
  }

  release() {
    this.active--;
    const next = this.waiters.shift();
    if (next) next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseDirectUpload(file: File): boolean {
  if (isVideoFile(file)) return false;
  if (file.type.startsWith("audio/") && file.size <= MAX_SERVER_UPLOAD_BYTES) return false;
  return file.size > MAX_SERVER_UPLOAD_BYTES;
}

function isAudioFile(file: File): boolean {
  return resolveFileMime(file).startsWith("audio/");
}

function rejectAudioPlaceholder(url: string | undefined, file: File): void {
  if (!isAudioFile(file)) return;
  if (!url || url.endsWith(".png") || url.includes("/catalog/guldaan/")) {
    throw new Error("Voice note upload returned an invalid audio URL");
  }
}

function isCorsError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg.includes("CORS") ||
    msg.includes("Direct storage upload blocked") ||
    msg.includes("storage CORS")
  );
}

async function probeDirectR2Upload(): Promise<boolean> {
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
    const data = await parseJsonResponse<{ uploadUrl?: string; demo?: boolean; error?: string }>(res);
    if (!res.ok || data.demo || !data.uploadUrl) return false;
    await putPartChunk(
      data.uploadUrl,
      new Blob([new Uint8Array(32)]),
      30_000,
      () => {}
    );
    return true;
  } catch {
    return false;
  }
}

async function initMultipartVideo(
  file: File,
  category: string,
  mimeType: string
): Promise<{
  demo?: boolean;
  uploadId?: string;
  key?: string;
  publicUrl?: string;
  fileName?: string;
  error?: string;
}> {
  const initRes = await fetch("/api/upload/multipart/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: mimeType,
      category,
      fileSize: file.size,
    }),
  });
  const initData = await parseJsonResponse<{
    demo?: boolean;
    uploadId?: string;
    key?: string;
    publicUrl?: string;
    fileName?: string;
    error?: string;
  }>(initRes);
  if (!initRes.ok) throw new Error(initData.error ?? `Could not start upload (${initRes.status})`);
  return initData;
}

async function completeMultipartVideo(
  initData: {
    uploadId: string;
    key: string;
    publicUrl: string;
    fileName?: string;
  },
  file: File,
  category: string,
  mimeType: string,
  parts: { partNumber: number; etag: string }[]
): Promise<{ url: string; fileName: string }> {
  const completeRes = await fetch("/api/upload/multipart/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId: initData.uploadId,
      key: initData.key,
      fileName: initData.fileName ?? file.name,
      contentType: mimeType,
      category,
      publicUrl: initData.publicUrl,
      parts,
    }),
  });
  const completeData = await parseJsonResponse<{ url?: string; fileName?: string; error?: string }>(
    completeRes
  );
  if (!completeRes.ok) throw new Error(completeData.error ?? `Upload failed (${completeRes.status})`);
  if (!completeData.url) throw new Error("Upload failed — no URL returned");
  return { url: completeData.url, fileName: completeData.fileName ?? file.name };
}

async function postRelayChunkWithProgress(
  uploadId: string,
  key: string,
  chunk: Blob,
  onLoaded: (loaded: number, total: number) => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const form = new FormData();
    form.append("uploadId", uploadId);
    form.append("key", key);
    form.append("file", chunk, "relay-chunk");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/multipart/relay");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onLoaded(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        try {
          const data = parseXhrJson<{ error?: string }>(xhr.responseText, xhr.status);
          reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection or try again"));
    xhr.send(form);
  });
}

async function uploadViaServerRelay(
  file: File,
  category: string,
  mimeType: string,
  label: string,
  onProgress?: ProgressCallback
): Promise<UploadResult> {
  const speedTracker = new UploadSpeedTracker();
  const relayLabel = label.includes("server") ? label : `${label.replace(/…$/, "")} via server…`;
  onProgress?.(buildProgressState(relayLabel, "uploading", 5, 0, file.size, speedTracker));

  const initData = await initMultipartVideo(file, category, mimeType);
  if (initData.demo) {
    if (file.size > MAX_SERVER_UPLOAD_BYTES) {
      throw new Error(
        `Video is too large for demo upload (${Math.round(file.size / 1024 / 1024)} MB). Configure R2 storage or use a file under 4 MB.`
      );
    }
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    return postFormWithStagedProgress("/api/upload", form, label, file, onProgress);
  }

  const uploadId = initData.uploadId!;
  const key = initData.key!;
  const publicUrl = initData.publicUrl!;
  let bytesSent = 0;

  try {
    for (let offset = 0; offset < file.size; offset += SERVER_RELAY_CHUNK_BYTES) {
      const chunk = file.slice(offset, offset + SERVER_RELAY_CHUNK_BYTES);
      const chunkStart = bytesSent;
      await postRelayChunkWithProgress(uploadId, key, chunk, (loaded) => {
        const bytesLoaded = chunkStart + loaded;
        const progress = Math.min(90, Math.round(5 + (bytesLoaded / file.size) * 85));
        onProgress?.(
          buildProgressState(relayLabel, "uploading", progress, bytesLoaded, file.size, speedTracker)
        );
      });
      bytesSent += chunk.size;
      onProgress?.(
        buildProgressState(relayLabel, "uploading", Math.min(90, Math.round(5 + (bytesSent / file.size) * 85)), bytesSent, file.size, speedTracker)
      );
    }

    onProgress?.({ label: "Processing upload…", progress: 92, status: "processing", bytesLoaded: file.size, bytesTotal: file.size });

    const flushRes = await fetch("/api/upload/multipart/relay/flush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, key }),
    });
    const flushData = await parseJsonResponse<{ parts?: { partNumber: number; etag: string }[]; error?: string }>(
      flushRes
    );
    if (!flushRes.ok) throw new Error(flushData.error ?? `Upload failed (${flushRes.status})`);
    if (!flushData.parts?.length) throw new Error("Upload failed — no parts uploaded");

    const completed = await completeMultipartVideo(
      { uploadId, key, publicUrl, fileName: initData.fileName },
      file,
      category,
      mimeType,
      flushData.parts
    );

    onProgress?.({
      label: "Upload complete",
      progress: 100,
      status: "done",
      bytesLoaded: file.size,
      bytesTotal: file.size,
    });
    return { url: completed.url, fileName: completed.fileName, mimeType };
  } catch (err) {
    await abortMultipartUploadClient(uploadId, key);
    throw err;
  }
}

function isRetryableUploadError(err: Error): boolean {
  const msg = err.message;
  if (msg.includes("CORS") || msg.includes("ETag missing") || msg.includes("Direct storage upload blocked")) {
    return false;
  }
  return true;
}

function formatPartTimeoutError(
  partNumber: number,
  totalParts: number,
  bytesLoaded: number,
  bytesTotal: number
): string {
  return `Upload timed out on part ${partNumber}/${totalParts} at ${formatBytes(bytesLoaded)} / ${formatBytes(bytesTotal)}. Try turning off VPN, using Wi‑Fi, or a smaller file.`;
}

function buildProgressState(
  label: string,
  status: UploadProgressStatus,
  progress: number,
  bytesLoaded: number,
  bytesTotal: number,
  speedTracker: UploadSpeedTracker
): UploadProgressState {
  const speed = speedTracker.sample(bytesLoaded, bytesTotal);
  return {
    label,
    status,
    progress,
    bytesLoaded,
    bytesTotal,
    ...speed,
  };
}

function putWithProgress(
  url: string,
  body: Blob | File,
  contentType: string,
  timeoutMs: number,
  onBytesProgress?: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = timeoutMs;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onBytesProgress) {
        onBytesProgress(e.loaded, e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error(CORS_ERROR_MESSAGE));
    xhr.ontimeout = () =>
      reject(new Error("Upload timed out — check your connection and try again"));
    xhr.send(body);
  });
}

function postFormWithStagedProgress(
  url: string,
  form: FormData,
  label: string,
  file: File,
  onProgress?: ProgressCallback,
  localPreviewUrl?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    onProgress?.({ label, progress: 10, status: "uploading", bytesTotal: file.size });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(85, Math.round(10 + (e.loaded / e.total) * 75));
        onProgress?.({
          label,
          progress: pct,
          status: "uploading",
          bytesLoaded: e.loaded,
          bytesTotal: e.total,
        });
      }
    };
    xhr.onload = () => {
      try {
        const data = parseXhrJson<{
          url?: string;
          fileName?: string;
          mimeType?: string;
          keepLocal?: boolean;
          error?: string;
        }>(xhr.responseText, xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          if (data.keepLocal && isAudioFile(file)) {
            if (!localPreviewUrl) {
              reject(new Error("Voice note preview URL missing"));
              return;
            }
            onProgress?.({ label, progress: 100, status: "done", bytesLoaded: file.size, bytesTotal: file.size });
            resolve({
              url: localPreviewUrl,
              fileName: data.fileName ?? file.name,
              mimeType: data.mimeType ?? resolveFileMime(file),
              keepLocal: true,
            });
            return;
          }
          if (data.url) {
            rejectAudioPlaceholder(data.url, file);
            onProgress?.({ label, progress: 100, status: "done", bytesLoaded: file.size, bytesTotal: file.size });
            resolve({
              url: data.url,
              fileName: data.fileName ?? file.name,
              mimeType: data.mimeType ?? resolveFileMime(file),
            });
            return;
          }
        }
        reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection or try again"));
    onProgress?.({ label, progress: 30, status: "uploading", bytesTotal: file.size });
    xhr.send(form);
  });
}

async function abortMultipartUploadClient(uploadId: string, key: string): Promise<void> {
  try {
    await fetch("/api/upload/multipart/abort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, key }),
    });
  } catch {
    // Best-effort cleanup
  }
}

async function putPartChunk(
  uploadUrl: string,
  chunk: Blob,
  timeoutMs: number,
  onPartProgress: (loaded: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.timeout = timeoutMs;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onPartProgress(e.loaded);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const raw = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
        if (!raw) {
          reject(new Error(ETAG_ERROR_MESSAGE));
          return;
        }
        resolve(raw.replace(/"/g, ""));
        return;
      }
      if (xhr.status === 403 || xhr.status === 0) {
        reject(new Error(CORS_ERROR_MESSAGE));
        return;
      }
      reject(new Error(`Upload part failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error(CORS_ERROR_MESSAGE));
    xhr.ontimeout = () => reject(new Error("__PART_TIMEOUT__"));
    xhr.send(chunk);
  });
}

async function uploadPartOnce(
  uploadId: string,
  key: string,
  partNumber: number,
  chunk: Blob,
  onPartProgress: (partNumber: number, loaded: number) => void
): Promise<{ partNumber: number; etag: string }> {
  const presignRes = await fetch("/api/upload/multipart/presign-part", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId, key, partNumber }),
  });
  const presignData = await parseJsonResponse<{ uploadUrl?: string; error?: string }>(presignRes);
  if (!presignRes.ok) throw new Error(presignData.error ?? `Could not presign part ${partNumber}`);

  const timeoutMs = partUploadTimeoutMs(chunk.size);
  const etag = await putPartChunk(presignData.uploadUrl!, chunk, timeoutMs, (loaded) => {
    onPartProgress(partNumber, loaded);
  });

  onPartProgress(partNumber, chunk.size);
  return { partNumber, etag };
}

async function uploadPartWithRetry(
  uploadId: string,
  key: string,
  partNumber: number,
  totalParts: number,
  chunk: Blob,
  fileSize: number,
  getBytesLoaded: () => number,
  onPartProgress: (partNumber: number, loaded: number) => void,
  onRetry?: (partNumber: number, attempt: number, totalParts: number) => void
): Promise<{ partNumber: number; etag: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < UPLOAD_PART_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = UPLOAD_PART_RETRY_DELAYS_MS[attempt - 1] ?? 10000;
      onRetry?.(partNumber, attempt + 1, totalParts);
      await sleep(delay);
      onPartProgress(partNumber, 0);
    }

    try {
      return await uploadPartOnce(uploadId, key, partNumber, chunk, onPartProgress);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.message === "__PART_TIMEOUT__") {
        lastError = new Error(
          formatPartTimeoutError(partNumber, totalParts, getBytesLoaded(), fileSize)
        );
      } else {
        lastError = error;
      }
      if (!isRetryableUploadError(lastError) || attempt === UPLOAD_PART_MAX_RETRIES - 1) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error(`Upload part ${partNumber} failed`);
}

async function uploadVideoViaParallelMultipart(
  file: File,
  category: string,
  mimeType: string,
  label: string,
  onProgress?: ProgressCallback
): Promise<UploadResult> {
  const speedTracker = new UploadSpeedTracker();
  onProgress?.(buildProgressState(label, "uploading", 5, 0, file.size, speedTracker));

  if (!(await probeDirectR2Upload())) {
    return uploadViaServerRelay(file, category, mimeType, label, onProgress);
  }

  const initData = await initMultipartVideo(file, category, mimeType);

  if (initData.demo) {
    if (file.size > MAX_SERVER_UPLOAD_BYTES) {
      throw new Error(
        `Video is too large for demo upload (${Math.round(file.size / 1024 / 1024)} MB). Configure R2 storage or use a file under 4 MB.`
      );
    }
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    return postFormWithStagedProgress("/api/upload", form, label, file, onProgress);
  }

  const uploadId = initData.uploadId!;
  const key = initData.key!;
  const publicUrl = initData.publicUrl!;
  const totalParts = Math.max(1, Math.ceil(file.size / MULTIPART_CHUNK_BYTES));
  const partLoaded = new Map<number, number>();
  const completedParts: { partNumber: number; etag: string }[] = [];
  const queue = Array.from({ length: totalParts }, (_, i) => i + 1);
  const limiter = new UploadConcurrencyLimiter(
    Math.min(MULTIPART_UPLOAD_CONCURRENCY, totalParts)
  );

  function aggregateBytesLoaded(): number {
    let bytesLoaded = 0;
    for (const loaded of partLoaded.values()) {
      bytesLoaded += loaded;
    }
    return bytesLoaded;
  }

  function reportAggregatedProgress(progressLabel = label) {
    const bytesLoaded = aggregateBytesLoaded();
    const progress = Math.min(90, Math.round(5 + (bytesLoaded / file.size) * 85));
    onProgress?.(
      buildProgressState(progressLabel, "uploading", progress, bytesLoaded, file.size, speedTracker)
    );
  }

  const speedCheckTimer = setTimeout(() => {
    const sample = speedTracker.sample(aggregateBytesLoaded(), file.size);
    if (sample.speedBps != null && sample.speedBps < SLOW_UPLOAD_THRESHOLD_BPS) {
      limiter.setMax(MULTIPART_SLOW_CONCURRENCY);
    }
  }, ADAPTIVE_SPEED_CHECK_MS);

  try {
    async function worker() {
      while (queue.length > 0) {
        const partNumber = queue.shift();
        if (partNumber == null) break;

        await limiter.acquire();
        try {
          const start = (partNumber - 1) * MULTIPART_CHUNK_BYTES;
          const chunk = file.slice(start, start + MULTIPART_CHUNK_BYTES);
          partLoaded.set(partNumber, 0);

          const part = await uploadPartWithRetry(
            uploadId,
            key,
            partNumber,
            totalParts,
            chunk,
            file.size,
            aggregateBytesLoaded,
            (pn, loaded) => {
              partLoaded.set(pn, loaded);
              reportAggregatedProgress();
            },
            (pn, attempt, total) => {
              reportAggregatedProgress(`Retrying part ${pn}/${total} (attempt ${attempt})…`);
            }
          );

          completedParts.push(part);
        } finally {
          limiter.release();
        }
      }
    }

    const workerCount = Math.min(MULTIPART_UPLOAD_CONCURRENCY, totalParts);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    onProgress?.({
      label: "Processing upload…",
      progress: 92,
      status: "processing",
      bytesLoaded: file.size,
      bytesTotal: file.size,
    });

    const completeRes = await fetch("/api/upload/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        key,
        fileName: initData.fileName ?? file.name,
        contentType: mimeType,
        category,
        publicUrl,
        parts: completedParts,
      }),
    });
    const completeData = await parseJsonResponse<{ url?: string; fileName?: string; error?: string }>(
      completeRes
    );
    if (!completeRes.ok) throw new Error(completeData.error ?? `Upload failed (${completeRes.status})`);
    if (!completeData.url) throw new Error("Upload failed — no URL returned");

    onProgress?.({
      label: "Upload complete",
      progress: 100,
      status: "done",
      bytesLoaded: file.size,
      bytesTotal: file.size,
    });
    return {
      url: completeData.url,
      fileName: completeData.fileName ?? file.name,
      mimeType,
    };
  } catch (err) {
    await abortMultipartUploadClient(uploadId, key);
    if (isCorsError(err)) {
      return uploadViaServerRelay(file, category, mimeType, label, onProgress);
    }
    throw err;
  } finally {
    clearTimeout(speedCheckTimer);
  }
}

async function uploadViaPresignedPut(
  file: File,
  category: string,
  mimeType: string,
  label: string,
  onProgress?: ProgressCallback,
  localPreviewUrl?: string
): Promise<UploadResult> {
  const speedTracker = new UploadSpeedTracker();
  onProgress?.(buildProgressState(label, "uploading", 5, 0, file.size, speedTracker));

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: mimeType,
      category,
      fileSize: file.size,
    }),
  });
  const presignData = await parseJsonResponse<{
    error?: string;
    demo?: boolean;
    keepLocal?: boolean;
    uploadUrl?: string;
    key?: string;
    fileName?: string;
    publicUrl?: string;
  }>(presignRes);
  if (!presignRes.ok) throw new Error(presignData.error ?? "Could not start upload");

  if (presignData.demo || presignData.keepLocal) {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    return postFormWithStagedProgress("/api/upload", form, label, file, onProgress, localPreviewUrl);
  }

  if (!presignData.uploadUrl || !presignData.publicUrl) {
    throw new Error(presignData.error ?? "Could not start upload");
  }

  const canDirect = await probeDirectR2Upload();
  if (!canDirect) {
    return uploadViaServerRelay(file, category, mimeType, label, onProgress);
  }

  try {
    await putWithProgress(
      presignData.uploadUrl,
      file,
      mimeType,
      UPLOAD_SINGLE_PUT_TIMEOUT_MS,
      (loaded, total) => {
        const progress = Math.min(90, Math.round((loaded / total) * 90));
        onProgress?.(buildProgressState(label, "uploading", progress, loaded, total, speedTracker));
      }
    );
  } catch (err) {
    if (isCorsError(err)) {
      if (file.size <= MAX_SERVER_UPLOAD_BYTES) {
        const form = new FormData();
        form.append("file", file);
        form.append("category", category);
        return postFormWithStagedProgress("/api/upload", form, label, file, onProgress, localPreviewUrl);
      }
      return uploadViaServerRelay(file, category, mimeType, label, onProgress);
    }
    throw err;
  }

  onProgress?.({
    label: "Processing upload…",
    progress: 92,
    status: "processing",
    bytesLoaded: file.size,
    bytesTotal: file.size,
  });

  const completeRes = await fetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: presignData.key,
      fileName: presignData.fileName,
      contentType: mimeType,
      category,
      publicUrl: presignData.publicUrl,
    }),
  });
  const completeData = await parseJsonResponse<{ url?: string; fileName?: string; error?: string }>(completeRes);
  if (!completeRes.ok) throw new Error(completeData.error ?? "Upload failed");
  if (!completeData.url) throw new Error("Upload failed — no URL returned");

  rejectAudioPlaceholder(completeData.url, file);
  onProgress?.({
    label: "Upload complete",
    progress: 100,
    status: "done",
    bytesLoaded: file.size,
    bytesTotal: file.size,
  });
  return {
    url: completeData.url,
    fileName: completeData.fileName ?? file.name,
    mimeType,
  };
}

export async function uploadFileWithProgress(
  file: File,
  category: string,
  onProgress?: ProgressCallback,
  localPreviewUrl?: string
): Promise<UploadResult> {
  const resolved = withResolvedMime(file);
  const mimeType = resolveFileMime(resolved);

  const label = isVideoFile(resolved)
    ? "Uploading video…"
    : mimeType.startsWith("audio/")
      ? "Uploading voice note…"
      : "Uploading file…";

  if (resolved.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new Error(
      `File is too large (${Math.round(resolved.size / 1024 / 1024)} MB). Maximum is ${Math.round(MAX_DIRECT_UPLOAD_BYTES / 1024 / 1024)} MB.`
    );
  }

  if (isVideoFile(resolved)) {
    if (resolved.size <= MAX_SERVER_UPLOAD_BYTES) {
      const form = new FormData();
      form.append("file", resolved);
      form.append("category", category);
      return postFormWithStagedProgress("/api/upload", form, label, resolved, onProgress);
    }
    if (resolved.size > PARALLEL_MULTIPART_THRESHOLD_BYTES) {
      return uploadVideoViaParallelMultipart(resolved, category, mimeType, label, onProgress);
    }
    return uploadViaPresignedPut(resolved, category, mimeType, label, onProgress, localPreviewUrl);
  }

  if (!shouldUseDirectUpload(resolved)) {
    const form = new FormData();
    form.append("file", resolved);
    form.append("category", category);
    return postFormWithStagedProgress("/api/upload", form, label, resolved, onProgress, localPreviewUrl);
  }

  return uploadViaPresignedPut(resolved, category, mimeType, label, onProgress, localPreviewUrl);
}

export async function uploadBlobWithProgress(
  blob: Blob,
  fileName: string,
  contentType: string,
  category: string,
  onProgress?: ProgressCallback,
  localPreviewUrl?: string
): Promise<UploadResult> {
  const file = new File([blob], fileName, { type: contentType });
  return uploadFileWithProgress(file, category, onProgress, localPreviewUrl);
}
