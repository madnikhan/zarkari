import { MAX_DIRECT_UPLOAD_BYTES, MAX_SERVER_UPLOAD_BYTES } from "./constants";

export type UploadProgressStatus = "uploading" | "processing" | "done" | "error";

export interface UploadProgressState {
  label: string;
  progress: number;
  status: UploadProgressStatus;
  error?: string;
}

type ProgressCallback = (state: UploadProgressState) => void;

function shouldUseDirectUpload(file: File): boolean {
  if (file.type.startsWith("audio/") && file.size <= MAX_SERVER_UPLOAD_BYTES) return false;
  return file.type.startsWith("video/") || file.size > MAX_SERVER_UPLOAD_BYTES;
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
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(body);
  });
}

function postFormWithStagedProgress(
  url: string,
  form: FormData,
  label: string,
  onProgress?: ProgressCallback
): Promise<{ url: string; fileName?: string }> {
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
        const data = JSON.parse(xhr.responseText) as { url?: string; fileName?: string; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && data.url) {
          onProgress?.({ label, progress: 100, status: "done" });
          resolve({ url: data.url, fileName: data.fileName });
        } else {
          reject(new Error(data.error ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    onProgress?.({ label, progress: 30, status: "uploading" });
    xhr.send(form);
  });
}

export async function uploadFileWithProgress(
  file: File,
  category: string,
  onProgress?: ProgressCallback
): Promise<{ url: string; fileName: string }> {
  const label = file.type.startsWith("video/")
    ? `Uploading video…`
    : file.type.startsWith("audio/")
      ? `Uploading voice note…`
      : `Uploading file…`;

  if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new Error(
      `File is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is ${Math.round(MAX_DIRECT_UPLOAD_BYTES / 1024 / 1024)} MB.`
    );
  }

  if (!shouldUseDirectUpload(file)) {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    const result = await postFormWithStagedProgress("/api/upload", form, label, onProgress);
    return { url: result.url, fileName: result.fileName ?? file.name };
  }

  onProgress?.({ label, progress: 5, status: "uploading" });

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      category,
      fileSize: file.size,
    }),
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignData.error ?? "Could not start upload");

  if (presignData.demo) {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    const result = await postFormWithStagedProgress("/api/upload", form, label, onProgress);
    return { url: result.url, fileName: result.fileName ?? file.name };
  }

  await putWithProgress(presignData.uploadUrl, file, file.type || "application/octet-stream", (pct) => {
    onProgress?.({ label, progress: Math.min(90, pct), status: "uploading" });
  });

  onProgress?.({ label: "Processing upload…", progress: 92, status: "processing" });

  const completeRes = await fetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: presignData.key,
      fileName: presignData.fileName,
      contentType: file.type || "application/octet-stream",
      category,
      publicUrl: presignData.publicUrl,
    }),
  });
  const completeData = await completeRes.json();
  if (!completeRes.ok) throw new Error(completeData.error ?? "Upload failed");

  onProgress?.({ label: "Upload complete", progress: 100, status: "done" });
  return { url: completeData.url, fileName: completeData.fileName ?? file.name };
}

export async function uploadBlobWithProgress(
  blob: Blob,
  fileName: string,
  contentType: string,
  category: string,
  onProgress?: ProgressCallback
): Promise<{ url: string; fileName: string }> {
  const file = new File([blob], fileName, { type: contentType });
  return uploadFileWithProgress(file, category, onProgress);
}
