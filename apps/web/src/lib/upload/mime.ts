const VIDEO_EXTENSIONS = new Set([".mov", ".mp4", ".webm", ".m4v", ".avi", ".mkv", ".ogv"]);
const AUDIO_EXTENSIONS = new Set([".m4a", ".mp3", ".ogg", ".wav", ".aac", ".opus"]);

const EXTENSION_MIME: Record<string, string> = {
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".ogv": "video/ogg",
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

export function withResolvedMime(file: File, kindHint?: MediaKind): File {
  let name = file.name?.trim() || "upload";
  let mime = resolveFileMime(file);

  if (kindHint === "video" && !mime.startsWith("video/")) {
    mime = "video/mp4";
  }

  if (mime.startsWith("video/") && !extensionOf(name)) {
    const ext =
      mime.includes("quicktime") || mime.includes("mov")
        ? ".mov"
        : mime.includes("webm")
          ? ".webm"
          : ".mp4";
    name = `${name}${ext}`;
  }

  if (file.type === mime && file.name === name) return file;
  return new File([file], name, { type: mime, lastModified: file.lastModified });
}
