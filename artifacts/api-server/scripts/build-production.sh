#!/usr/bin/env bash
# Production build script for the API Server artifact.
#
# Build dependency note:
# The API server serves the crypto-castle frontend as static files from
# artifacts/crypto-castle/dist/. That dist must be built BEFORE the
# api-server TypeScript build so the output is present and fresh on every
# production deployment. Rebuilding it here ensures that no stale or missing
# dist files reach production without requiring a separate manual step.

set -euo pipefail

echo "==> Building crypto-castle frontend..."
pnpm --filter @workspace/crypto-castle run build

echo "==> Building api-server..."
pnpm --filter @workspace/api-server run build

echo "==> Production build complete."
