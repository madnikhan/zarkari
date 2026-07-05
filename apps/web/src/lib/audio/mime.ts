/** Normalize MediaRecorder MIME for Blob / File / audio element. */
export function normalizeAudioMime(mime: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase() || "audio/webm";
  if (base.startsWith("audio/")) return base;
  return "audio/webm";
}

export function isMp4Family(mime: string): boolean {
  const base = normalizeAudioMime(mime);
  return base.includes("mp4") || base.includes("m4a") || base.includes("aac");
}

export function extensionForAudioMime(mime: string): string {
  const base = normalizeAudioMime(mime);
  if (base.includes("mp4") || base.includes("m4a")) return "m4a";
  if (base.includes("ogg")) return "ogg";
  if (base.includes("wav")) return "wav";
  return "webm";
}

export function isSafariWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|Firefox|Edg|OPR/i.test(ua);
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const webkit = isSafariWebKit();
  const candidates = webkit
    ? ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function shouldUseTimeslice(mime: string): boolean {
  return !isMp4Family(mime);
}
