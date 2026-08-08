const VIDEO_EXTENSIONS = new Set([
  ".mov",
  ".mp4",
  ".webm",
  ".m4v",
  ".avi",
  ".mkv",
  ".ogv",
  ".3gp",
  ".3gpp",
  ".hevc",
  ".mts",
  ".m2ts",
]);
const AUDIO_EXTENSIONS = new Set([".m4a", ".mp3", ".ogg", ".wav", ".aac", ".opus"]);

const EXTENSION_MIME: Record<string, string> = {
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".ogv": "video/ogg",
  ".3gp": "video/3gpp",
  ".3gpp": "video/3gpp",
  ".hevc": "video/mp4",
  ".mts": "video/mp2t",
  ".m2ts": "video/mp2t",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
  ".opus": "audio/opus",
};

export type MediaKind = "image" | "video" | "audio";

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function hasVideoExtension(fileName: string): boolean {
  return VIDEO_EXTENSIONS.has(extensionOf(fileName));
}

export function resolveFileMime(file: File): string {
  const type = file.type?.trim();
  if (type && type !== "application/octet-stream") return type;
  const ext = extensionOf(file.name);
  return EXTENSION_MIME[ext] ?? type ?? "application/octet-stream";
}

export function isAudioFileName(fileName: string, mimeType?: string, category?: string): boolean {
  if (mimeType?.startsWith("audio/")) return true;
  if (category === "order-voice") return true;
  if (/voice-note/i.test(fileName)) return true;
  return AUDIO_EXTENSIONS.has(extensionOf(fileName));
}

export function isVideoFile(file: File): boolean {
  if (isAudioFileName(file.name, resolveFileMime(file))) return false;
  const mime = resolveFileMime(file);
  if (mime.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.has(extensionOf(file.name));
}

export function isVideoFileName(fileName: string, mimeType?: string, category?: string): boolean {
  if (getMediaKind(fileName, mimeType, category) === "video") return true;
  return false;
}

export function getMediaKind(fileName: string, mimeType?: string, category?: string): MediaKind {
  if (mimeType?.startsWith("audio/")) return "audio";
  if (category === "order-voice") return "audio";
  if (/voice-note/i.test(fileName)) return "audio";
  if (AUDIO_EXTENSIONS.has(extensionOf(fileName)) && !mimeType?.startsWith("video/")) return "audio";
  if (mimeType?.startsWith("video/")) return "video";
  if (VIDEO_EXTENSIONS.has(extensionOf(fileName))) return "video";
  return "image";
}

/** Coerce content-type for multipart when client/phone left MIME blank. */
export function coerceVideoContentType(fileName: string, contentType: string): string {
  const ct = contentType?.trim() || "";
  if (ct.startsWith("video/")) return ct;
  const ext = extensionOf(fileName);
  if (EXTENSION_MIME[ext]?.startsWith("video/")) return EXTENSION_MIME[ext];
  if (VIDEO_EXTENSIONS.has(ext) || !ext) return "video/mp4";
  return ct || "video/mp4";
}

export function withResolvedMime(file: File, kindHint?: MediaKind): File {
  let name = file.name?.trim() || "upload";
  let mime = resolveFileMime(file);

  if (kindHint === "video" && !mime.startsWith("video/")) {
    mime = "video/mp4";
  }
  if (kindHint === "image" && !mime.startsWith("image/") && !mime.startsWith("video/")) {
    mime = "image/jpeg";
  }

  if (mime.startsWith("video/") && !extensionOf(name)) {
    const ext =
      mime.includes("quicktime") || mime.includes("mov")
        ? ".mov"
        : mime.includes("webm")
          ? ".webm"
          : mime.includes("3gpp")
            ? ".3gp"
            : ".mp4";
    name = `${name}${ext}`;
  }

  if (file.type === mime && file.name === name) return file;
  return new File([file], name, { type: mime, lastModified: file.lastModified });
}
