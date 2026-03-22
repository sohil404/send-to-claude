#!/bin/bash
# One-time setup for Send to Claude Code
# Usage: ./install.sh [extension-id]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_SCRIPT_SRC="$SCRIPT_DIR/host/bridge.py"
HOST_DEST="$HOME/.claude/send-to-claude-bridge.py"
HOST_NAME="com.sendtoclaude.bridge"

# Copy bridge to ~/.claude/ (Chrome can't access external drives)
mkdir -p "$HOME/.claude"
cp "$HOST_SCRIPT_SRC" "$HOST_DEST"
chmod +x "$HOST_DEST"

# Accept extension ID as argument or prompt
EXT_ID="${1:-}"

if [ -z "$EXT_ID" ]; then
  echo ""
  echo "  Send to Claude Code — Setup"
  echo "  ─────────────────────────────"
  echo ""
  echo "  1. Go to chrome://extensions"
  echo "  2. Enable Developer Mode (top-right)"
  echo "  3. Load unpacked → select: $SCRIPT_DIR"
  echo "  4. Copy the Extension ID shown below the extension name"
  echo ""
  read -p "  Extension ID: " EXT_ID
fi

if [ -z "$EXT_ID" ]; then
  echo "  No ID. Exiting."
  exit 1
fi

# Build native messaging manifest
MANIFEST=$(cat <<EOF
{
  "name": "$HOST_NAME",
  "description": "Send to Claude Code bridge",
  "path": "$HOST_DEST",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXT_ID/"]
}
EOF
)

# Install for all detected Chromium browsers
if [[ "$OSTYPE" == "darwin"* ]]; then
  DIRS=(
    "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
    "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
    "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
    "$HOME/Library/Application Support/Arc/User Data/NativeMessagingHosts"
  )
elif [[ "$OSTYPE" == "linux"* ]]; then
  DIRS=(
    "$HOME/.config/google-chrome/NativeMessagingHosts"
    "$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
    "$HOME/.config/microsoft-edge/NativeMessagingHosts"
    "$HOME/.config/chromium/NativeMessagingHosts"
  )
else
  echo "  Unsupported OS: $OSTYPE"
  exit 1
fi

INSTALLED=0
for DIR in "${DIRS[@]}"; do
  PARENT="$(dirname "$DIR")"
  if [ -d "$PARENT" ]; then
    mkdir -p "$DIR"
    echo "$MANIFEST" > "$DIR/$HOST_NAME.json"
    BROWSER="$(basename "$(dirname "$PARENT")" 2>/dev/null || basename "$PARENT")"
    echo "  ✓ Installed for $BROWSER"
    INSTALLED=1
  fi
done

if [ "$INSTALLED" -eq 0 ]; then
  mkdir -p "${DIRS[0]}"
  echo "$MANIFEST" > "${DIRS[0]}/$HOST_NAME.json"
  echo "  ✓ Installed for Chrome"
fi

echo ""
echo "  Done! Reload the extension on chrome://extensions (click the ↻ icon)."
echo "  In Claude Code: cat /tmp/claude-page.json"
echo ""
