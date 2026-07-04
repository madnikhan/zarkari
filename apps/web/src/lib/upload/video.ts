import { MAX_VIDEO_DURATION_SEC } from "./constants";

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video file"));
    };
    video.src = url;
  });
}

export async function assertVideoDurationAllowed(file: File): Promise<void> {
  if (!file.type.startsWith("video/")) return;
  const duration = await getVideoDuration(file);
  if (!Number.isFinite(duration) || duration <= 0) return;
  if (duration > MAX_VIDEO_DURATION_SEC) {
    const mins = Math.ceil(duration / 60);
    throw new Error(`Video is ${mins} minutes long. Maximum allowed is 10 minutes.`);
  }
}
