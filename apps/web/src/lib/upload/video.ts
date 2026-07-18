import { MAX_VIDEO_DURATION_SEC } from "./constants";
import { isVideoFile, resolveFileMime } from "./mime";

/** Returns duration in seconds, or NaN if metadata cannot be read. */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      // Phone HEVC/.mov often fails metadata outside Safari — skip duration gate.
      resolve(Number.NaN);
    };
    video.src = url;
  });
}

export async function assertVideoDurationAllowed(file: File): Promise<void> {
  if (!isVideoFile(file)) return;
  const duration = await getVideoDuration(file);
  if (!Number.isFinite(duration) || duration <= 0) return;
  if (duration > MAX_VIDEO_DURATION_SEC) {
    const mins = Math.ceil(duration / 60);
    throw new Error(`Video is ${mins} minutes long. Maximum allowed is 10 minutes.`);
  }
}

export function isVideoUpload(file: File): boolean {
  return isVideoFile(file);
}

export { resolveFileMime };
