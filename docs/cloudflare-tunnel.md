# Share with Client via Cloudflare Tunnel

Use a free Cloudflare quick tunnel to show the local dev site to your client — no port forwarding or deployment needed.

## Quick start

**Terminal 1** — start the dev server:

```bash
cd apps/web
npm run dev
```

**Terminal 2** — create the public tunnel (from repo root):

```bash
./scripts/share-tunnel.sh
```

Cloudflare prints a public URL like:

```
https://random-words-here.trycloudflare.com
```

Send that link to your client. It stays live while the tunnel is running.

Press **Ctrl+C** in Terminal 2 to stop sharing.

## Notes

- The URL is **temporary** and changes each time you run `npm run share`
- No Cloudflare account required for quick tunnels
- Your laptop must stay on and both terminals must keep running
- First run downloads `cloudflared` to `bin/cloudflared` automatically

## Custom port

If the dev server runs on a different port:

```bash
PORT=3001 npm run share
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Dev server is not running" | Start `npm run dev` first |
| Client sees broken styles | Restart `npm run dev` after starting the tunnel |
| Tunnel fails to connect | Check internet connection; re-run `npm run share` |

## Permanent tunnel (optional)

For a stable URL (e.g. `preview.zarkari.co.uk`), set up a named Cloudflare Tunnel in your Cloudflare dashboard and point it at `http://localhost:3000`. Quick tunnels are enough for client demos.
