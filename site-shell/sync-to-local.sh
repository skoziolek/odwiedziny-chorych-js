#!/usr/bin/env bash
# Synchronizacja do LocalWP z Git Bash / WSL
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/wordpress-plugin/odwiedziny-chorych"
HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG_LOCAL="$HERE/config.local.sh"
CONFIG_EXAMPLE="$HERE/config.example.sh"

if [[ ! -f "$CONFIG_LOCAL" ]]; then
  echo ""
  echo "Brak config.local.sh — skopiuj config.example.sh -> config.local.sh i ustaw TARGET_PLUGIN_DIR"
  echo ""
  exit 1
fi

# shellcheck source=/dev/null
source "$CONFIG_LOCAL"

if [[ -z "${TARGET_PLUGIN_DIR:-}" ]]; then
  echo "Ustaw TARGET_PLUGIN_DIR w config.local.sh"
  exit 1
fi

if [[ ! -d "$SOURCE" ]]; then
  echo "Brak źródła: $SOURCE"
  exit 1
fi

mkdir -p "$TARGET_PLUGIN_DIR"

echo ""
echo "Synchronizacja -> $TARGET_PLUGIN_DIR"
echo "  Z: $SOURCE"
echo ""

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.git' "$SOURCE/" "$TARGET_PLUGIN_DIR/"
else
  echo "Brak rsync — użyj sync-to-local.ps1 w PowerShell lub zainstaluj rsync (Git for Windows)."
  exit 1
fi

echo "Gotowe."
echo ""
