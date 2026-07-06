# R2 CORS setup for browser uploads

Large video and file uploads send data **directly from the browser to Cloudflare R2** using presigned URLs. Without a CORS policy on the bucket, the browser blocks these requests and you may see:

- `Upload blocked by storage CORS`
- `CORS header 'Access-Control-Allow-Origin' missing`
- Status `403` on requests to `*.r2.cloudflarestorage.com`

Small files (≤ 4 MB) use server upload (`POST /api/upload`) and do **not** need CORS.

Videos and large files (> 4 MB) use a **single presigned PUT** from the browser to R2 (`POST /api/upload/presign` → PUT → `POST /api/upload/complete`). One PUT per file — not multipart chunks.

## Configure CORS in Cloudflare

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → bucket **`zarkari-files`** (or your `R2_BUCKET` name).
2. Go to **Settings** → **CORS policy**.
3. Click **Add CORS policy** and paste:

```json
[
  {
    "AllowedOrigins": [
      "https://www.zarkari.co.uk",
      "https://zarkari.co.uk",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Save. Changes apply immediately — no Vercel redeploy required.

### Why `ExposeHeaders: ["ETag"]` is included

`ETag` is optional for single PUT uploads but recommended if you use multipart APIs elsewhere. Keep it in the policy for compatibility.

## Verify

1. Hard-refresh `https://www.zarkari.co.uk/admin/orders/new`
2. Upload a `.MOV` or `.MP4` larger than 5 MB
3. In browser DevTools → **Network**, find the `PUT` to `r2.cloudflarestorage.com`
4. Expect **200** and an `ETag` response header

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS missing on PUT | Add/update CORS policy above |
| Upload OK but "ETag missing" | Add `ETag` to `ExposeHeaders` |
| Works locally, fails on production | Ensure `https://www.zarkari.co.uk` is in `AllowedOrigins` |
| Files ≤ 4 MB fail | Check `/api/upload` and R2 credentials on Vercel, not CORS |
| Files > 5 MB fail after CORS fix | Confirm presigned URL returns 200; check R2 API token permissions |

## Related env vars

Set on Vercel (and `apps/web/.env.local` for local dev):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

See [`.env.example`](../.env.example).
