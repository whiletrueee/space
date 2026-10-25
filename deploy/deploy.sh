#!/usr/bin/env bash
# Build the static site (the scrub gate runs inside the build) and ship it to the VPS.
set -euo pipefail
cd "$(dirname "$0")/.."

yarn build
rsync -az --delete --chmod=D755,F644 out/ vps:/var/www/whiletrueee/
echo "deployed → https://whiletrueee.com"
