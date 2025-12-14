#!/usr/bin/env bash
#
# Bootstrap SDK-1600 Tools (as1600, bin2rom)
#
# This script builds as1600 and bin2rom from the jzintv source tree
# and installs them to tools/bin/<platform>/ for use by both humans
# and agents (Claude Code, etc.)
#
# Usage:
#   ./tools/bootstrap-sdk1600.sh
#
# After running, you can use:
#   ./tools/as1600 <args>
#   ./tools/bin2rom <args>
#

set -euo pipefail

# Determine repository root
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Detect platform
PLATFORM="$(uname -s)-$(uname -m)"
echo "Platform: $PLATFORM"

# Output directory for platform-specific binaries
OUT="$ROOT/tools/bin/$PLATFORM"
mkdir -p "$OUT"

# Check if tools already exist
if [[ -x "$OUT/as1600" ]] && [[ -x "$OUT/bin2rom" ]]; then
  echo "✅ Tools already installed:"
  echo "   $OUT/as1600"
  echo "   $OUT/bin2rom"
  exit 0
fi

# Source directory
SRC="$ROOT/resources/jzintv-20200712-src"

if [[ ! -d "$SRC" ]]; then
  echo "❌ Error: jzintv source not found at:"
  echo "   $SRC"
  echo ""
  echo "Expected to find jzintv-20200712-src in resources/ directory."
  echo "Please ensure the source tree is available before running bootstrap."
  exit 1
fi

echo "Building SDK-1600 tools from source..."
echo "Source: $SRC"
echo "Output: $OUT"
echo ""

# Build as1600
echo "Building as1600..."
(cd "$SRC/as1600" && make clean && make) || {
  echo "❌ Failed to build as1600"
  exit 1
}

# Build bin2rom
echo "Building bin2rom..."
(cd "$SRC/bin2rom" && make clean && make) || {
  echo "❌ Failed to build bin2rom"
  exit 1
}

# Copy binaries to output directory
echo ""
echo "Installing binaries..."

if [[ -f "$SRC/as1600/as1600" ]]; then
  cp "$SRC/as1600/as1600" "$OUT/as1600"
  chmod +x "$OUT/as1600"
  echo "✅ Installed: $OUT/as1600"
else
  echo "❌ Error: as1600 binary not found after build"
  exit 1
fi

if [[ -f "$SRC/bin2rom/bin2rom" ]]; then
  cp "$SRC/bin2rom/bin2rom" "$OUT/bin2rom"
  chmod +x "$OUT/bin2rom"
  echo "✅ Installed: $OUT/bin2rom"
else
  echo "❌ Error: bin2rom binary not found after build"
  exit 1
fi

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "Tools installed to: $OUT"
echo ""
echo "You can now use:"
echo "  ./tools/as1600 [args]     - Assemble .asm files"
echo "  ./tools/bin2rom [args]    - Convert .bin to .rom"
echo ""
echo "Or via npm:"
echo "  npm run as1600 -- [args]"
echo "  npm run bin2rom -- [args]"
echo ""
