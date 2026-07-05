const VIDEO_EXTENSIONS = new Set([".mov", ".mp4", ".webm", ".m4v", ".avi", ".mkv", ".ogv"]);

const EXTENSION_MIME: Record<string, string> = {
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".ogv": "video/ogg",
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function resolveFileMime(file: File): string {
  const type = file.type?.trim();
  if (type && type !== "application/octet-stream") return type;
  const ext = extensionOf(file.name);
  return EXTENSION_MIME[ext] ?? type ?? "application/octet-stream";
}

export function isVideoFile(file: File): boolean {
  const mime = resolveFileMime(file);
  if (mime.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.has(extensionOf(file.name));
}

export function isVideoFileName(fileName: string, mimeType?: string): boolean {
  if (mimeType?.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.has(extensionOf(fileName));
}

export function withResolvedMime(file: File): File {
  const mime = resolveFileMime(file);
  if (file.type === mime) return file;
  return new File([file], file.name, { type: mime, lastModified: file.lastModified });
}
