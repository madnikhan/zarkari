export const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Client-side cap; server may read MAX_DIRECT_UPLOAD_BYTES env for presign validation */
export const MAX_DIRECT_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SEC = 10 * 60;
/** Video multipart chunk size — 5 MB minimum for R2/S3; parts upload direct to R2 via presigned URLs */
export const MULTIPART_CHUNK_BYTES = 5 * 1024 * 1024;
/** Videos above this size use parallel multipart upload (4 concurrent parts) */
export const PARALLEL_MULTIPART_THRESHOLD_BYTES = 10 * 1024 * 1024;
export const MULTIPART_UPLOAD_CONCURRENCY = 4;
/** When measured speed drops below this, reduce to serial/slow concurrency */
export const SLOW_UPLOAD_THRESHOLD_BPS = 100 * 1024;
export const MULTIPART_SLOW_CONCURRENCY = 1;
export const ADAPTIVE_SPEED_CHECK_MS = 5000;
export const UPLOAD_PART_MAX_RETRIES = 3;
export const UPLOAD_PART_RETRY_DELAYS_MS = [2000, 5000, 10000] as const;
export const UPLOAD_PART_MIN_TIMEOUT_MS = 15 * 60 * 1000;
export const UPLOAD_PART_MAX_TIMEOUT_MS = 60 * 60 * 1000;
/** Assume at least this speed when scaling per-part timeout (50 KB/s) */
export const UPLOAD_PART_MIN_SPEED_BPS = 50_000;
export const UPLOAD_SINGLE_PUT_TIMEOUT_MS = 60 * 60 * 1000;
/** Client → server relay slices (Vercel body limit ~4.5 MB) */
export const SERVER_RELAY_CHUNK_BYTES = 4 * 1024 * 1024;
export const R2_MIN_PART_BYTES = 5 * 1024 * 1024;

export function partUploadTimeoutMs(chunkSize: number): number {
  const scaled = Math.ceil((chunkSize / UPLOAD_PART_MIN_SPEED_BPS) * 1000);
  return Math.min(
    UPLOAD_PART_MAX_TIMEOUT_MS,
    Math.max(UPLOAD_PART_MIN_TIMEOUT_MS, scaled)
  );
}

export function maxDirectUploadBytesFromEnv(): number {
  return Number(process.env.MAX_DIRECT_UPLOAD_BYTES) || MAX_DIRECT_UPLOAD_BYTES;
}
