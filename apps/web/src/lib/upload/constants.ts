export const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Client-side cap; server may read MAX_DIRECT_UPLOAD_BYTES env for presign validation */
export const MAX_DIRECT_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SEC = 10 * 60;
/** Video multipart chunk size — 5 MB minimum for R2/S3; parts upload direct to R2 via presigned URLs */
export const MULTIPART_CHUNK_BYTES = 5 * 1024 * 1024;
/** Videos above this size use parallel multipart upload (4 concurrent parts) */
export const PARALLEL_MULTIPART_THRESHOLD_BYTES = 10 * 1024 * 1024;
export const MULTIPART_UPLOAD_CONCURRENCY = 4;

export function maxDirectUploadBytesFromEnv(): number {
  return Number(process.env.MAX_DIRECT_UPLOAD_BYTES) || MAX_DIRECT_UPLOAD_BYTES;
}
