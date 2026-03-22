#!/bin/bash
# Install native messaging host for Send to Claude Code
# Supports Chrome and Chromium-based browsers (Brave, Edge, Arc, etc.)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_SCRIPT="$SCRIPT_DIR/host/bridge.py"
HOST_NAME="com.sendtoclaude.bridge"

chmod +x "$HOST_SCRIPT"

echo "=== Send to Claude Code — Setup ==="
echo ""
echo "1. Open chrome://extensions (or brave://extensions, edge://extensions)"
echo "2. Enable Developer Mode"
echo "3. Click 'Load unpacked' and select: $SCRIPT_DIR"
echo "4. Copy the Extension ID shown under the extension name"
echo ""
read -p "Paste your Extension ID: " EXT_ID

if [ -z "$EXT_ID" ]; then
  echo "No ID provided. Exiting."
  exit 1
fi

# Create native messaging host manifest
MANIFEST="{
  \"name\": \"$HOST_NAME\",
  \"description\": \"Send to Claude Code native bridge\",
  \"path\": \"$HOST_SCRIPT\",
  \"type\": \"stdio\",
  \"allowed_origins\": [\"chrome-extension://$EXT_ID/\"]
}"

# Detect OS and set paths
if [[ "$OSTYPE" == "darwin"* ]]; then
  DIRS=(
    "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
    "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
    "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
  )
elif [[ "$OSTYPE" == "linux"* ]]; then
  DIRS=(
    "$HOME/.config/google-chrome/NativeMessagingHosts"
    "$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
    "$HOME/.config/microsoft-edge/NativeMessagingHosts"
    "$HOME/.config/chromium/NativeMessagingHosts"
  )
else
  echo "Unsupported OS: $OSTYPE"
  exit 1
fi

INSTALLED=0
for DIR in "${DIRS[@]}"; do
  PARENT="$(dirname "$DIR")"
  if [ -d "$PARENT" ]; then
    mkdir -p "$DIR"
    echo "$MANIFEST" > "$DIR/$HOST_NAME.json"
    echo "Installed: $DIR/$HOST_NAME.json"
    INSTALLED=1
  fi
done

if [ "$INSTALLED" -eq 0 ]; then
  # Fallback: install for Chrome anyway
  DIR="${DIRS[0]}"
  mkdir -p "$DIR"
  echo "$MANIFEST" > "$DIR/$HOST_NAME.json"
  echo "Installed: $DIR/$HOST_NAME.json"
fi

echo ""
echo "Done! Click the extension icon, then in Claude Code run:"
echo "  cat /tmp/claude-page.json"
