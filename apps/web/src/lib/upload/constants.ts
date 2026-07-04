export const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Client-side cap; server may read MAX_DIRECT_UPLOAD_BYTES env for presign validation */
export const MAX_DIRECT_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SEC = 10 * 60;

export function maxDirectUploadBytesFromEnv(): number {
  return Number(process.env.MAX_DIRECT_UPLOAD_BYTES) || MAX_DIRECT_UPLOAD_BYTES;
}
