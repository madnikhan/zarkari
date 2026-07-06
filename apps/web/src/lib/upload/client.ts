import { MAX_DIRECT_UPLOAD_BYTES, MAX_SERVER_UPLOAD_BYTES } from "./constants";
import { isVideoFile, resolveFileMime, withResolvedMime } from "./mime";
import { parseJsonResponse, parseXhrJson } from "./parse-json";

const CORS_ERROR_MESSAGE =
  "Upload blocked by storage CORS. Configure R2 CORS for this site (see docs/r2-cors-setup.md).";
const UPLOAD_PUT_TIMEOUT_MS = 15 * 60 * 1000;

export type UploadProgressStatus = "uploading" | "processing" | "done" | "error";

export interface UploadProgressState {
  label: string;
  progress: number;
  status: UploadProgressStatus;
  error?: string;
}

type ProgressCallback = (state: UploadProgressState) => void;

export interface UploadResult {
  url: string;
  fileName: string;
  mimeType?: string;
  keepLocal?: boolean;
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

function putWithProgress(
  url: string,
  body: Blob | File,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = UPLOAD_PUT_TIMEOUT_MS;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
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
    onProgress?.({ label, progress: 10, status: "uploading" });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(85, Math.round(10 + (e.loaded / e.total) * 75));
        onProgress?.({ label, progress: pct, status: "uploading" });
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
            onProgress?.({ label, progress: 100, status: "done" });
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
            onProgress?.({ label, progress: 100, status: "done" });
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
    onProgress?.({ label, progress: 30, status: "uploading" });
    xhr.send(form);
  });
}

async function uploadViaPresignedPut(
  file: File,
  category: string,
  mimeType: string,
  label: string,
  onProgress?: ProgressCallback,
  localPreviewUrl?: string
): Promise<UploadResult> {
  onProgress?.({ label, progress: 5, status: "uploading" });

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

  await putWithProgress(presignData.uploadUrl, file, mimeType, (pct) => {
    onProgress?.({ label, progress: Math.min(90, pct), status: "uploading" });
  });

  onProgress?.({ label: "Processing upload…", progress: 92, status: "processing" });

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
  onProgress?.({ label: "Upload complete", progress: 100, status: "done" });
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
