#!/usr/bin/env bash
set -euo pipefail
BRIDGE_DIR="/Users/dalao/.openclaw/workspace/mira/services/openclaw-bridge"
TSX_BIN="/Users/dalao/.openclaw/workspace/mira/node_modules/.bin/tsx"
exec "$TSX_BIN" --env-file="$BRIDGE_DIR/.env" --env-file-if-exists="$BRIDGE_DIR/.env.local" "$BRIDGE_DIR/src/index.ts"
