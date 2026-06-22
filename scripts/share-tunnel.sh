#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLOUDFLARED="$ROOT/bin/cloudflared"
URL="http://127.0.0.1:${PORT}"

install_cloudflared() {
  echo "Installing cloudflared..."
  mkdir -p "$ROOT/bin"
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" \
    -o "$CLOUDFLARED"
  chmod +x "$CLOUDFLARED"
}

if [[ ! -x "$CLOUDFLARED" ]]; then
  install_cloudflared
fi

if ! curl -fsS "$URL" >/dev/null 2>&1; then
  echo ""
  echo "Dev server is not running on port ${PORT}."
  echo "Start it first in another terminal:"
  echo ""
  echo "  cd apps/web && npm run dev"
  echo ""
  exit 1
fi

echo ""
echo "Creating Cloudflare quick tunnel → ${URL}"
echo "Share the https://*.trycloudflare.com URL with your client."
echo "Press Ctrl+C to stop the tunnel."
echo ""

exec "$CLOUDFLARED" tunnel --url "$URL"
