# R2 CORS setup for browser uploads

Large video and file uploads send data **directly from the browser to Cloudflare R2** using presigned URLs. Without a CORS policy on the bucket, the browser blocks these requests and you may see:

- `Upload blocked by storage CORS`
- `CORS header 'Access-Control-Allow-Origin' missing`
- Status `403` on requests to `*.r2.cloudflarestorage.com`

Small files (≤ 4 MB) use server upload (`POST /api/upload`) and do **not** need CORS.

## Upload paths by file size

| Size | Path |
|------|------|
| ≤ 4 MB | Server upload (`POST /api/upload`) — no CORS |
| 4–10 MB video | Single presigned PUT (`/api/upload/presign` → PUT → `/api/upload/complete`) |
| > 10 MB video | Parallel multipart to R2, or **server relay** if CORS blocks direct upload |

If R2 CORS is not configured, uploads automatically fall back to **server relay** (4 MB slices through your app to R2 — no CORS needed).

Large uploads (66 MB+) retry failed parts automatically (up to 3 attempts) and abort incomplete multipart uploads on failure.

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

### Why `ExposeHeaders: ["ETag"]` matters

Videos over 10 MB use parallel multipart uploads. Each part reads the `ETag` response header after PUT. If `ETag` is not exposed, multipart uploads fail even when CORS origins are correct.

## Verify

1. Hard-refresh `https://www.zarkari.co.uk/admin/orders/new`
2. Upload a `.MOV` or `.MP4` larger than 10 MB
3. In browser DevTools → **Network**, find multiple `PUT` requests to `r2.cloudflarestorage.com` (up to 4 in flight)
4. Expect **200** and an `ETag` response header on each part

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Upload blocked by storage CORS` | App should auto-retry via server; if it persists, add CORS policy below |
| Upload OK but "ETag missing" | Add `ETag` to `ExposeHeaders` |
| Works locally, fails on production | Ensure `https://www.zarkari.co.uk` is in `AllowedOrigins` |
| Files ≤ 4 MB fail | Check `/api/upload` and R2 credentials on Vercel, not CORS |
| Files > 10 MB fail after CORS fix | Confirm presigned part URLs return 200; check R2 API token permissions |
| Upload very slow (10+ min for 25 MB) | Check upload speed in progress bar; turn off VPN; home upload may be ~30–40 KB/s |
| `Upload timed out on part X/Y` | Slow connection — turn off VPN, use Wi‑Fi; each part allows up to 60 min with auto-retry |
| 66 MB+ video fails repeatedly | Ensure stable connection; progress bar shows speed — need ~50 KB/s+ sustained |

iPhone `.MOV` files are often large (high bitrate) even for short clips — 25 MB for 9 seconds is normal. Slow uploads are usually network bandwidth, not the app. **Turn off VPN** before uploading large videos.

## Related env vars

Set on Vercel (and `apps/web/.env.local` for local dev):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

See [`.env.example`](../.env.example).
