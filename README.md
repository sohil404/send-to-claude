# Send to Claude Code

Chrome extension that sends any webpage or selected text to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with one click.

Click the toolbar icon → pick "Send full page" or "Send selection" → content is saved to `/tmp/claude-page.json` and copied to your clipboard. Then in Claude Code:

```bash
cat /tmp/claude-page.json
```

Or just tell Claude: *"read what I sent from Chrome"*

## Install

**1. Clone this repo**

```bash
git clone https://github.com/YOUR_USERNAME/send-to-claude.git
```

**2. Load in Chrome**

1. Go to `chrome://extensions` (or `brave://extensions`, `edge://extensions`)
2. Enable **Developer Mode** (top-right)
3. Click **Load unpacked** → select the `send-to-claude` folder
4. Pin the extension to your toolbar

**3. Run the install script**

```bash
cd send-to-claude
chmod +x install.sh
./install.sh
```

It will ask for your Extension ID (shown on the extensions page) and set up the native messaging host that writes the file.

## How it works

```
Chrome Extension → Native Messaging Host (Python) → /tmp/claude-page.json → Claude Code
```

- **Toolbar button**: Opens a popup with "Send full page" and "Send selection"
- **Right-click menu**: "Send selection to Claude Code" for highlighted text
- **Clipboard**: Content is also copied to your clipboard
- **File output**: JSON with `url`, `title`, `text`, `timestamp`, `type`

## Requirements

- Chrome, Brave, Edge, Arc, or any Chromium-based browser
- Python 3 (pre-installed on macOS and most Linux)
- macOS or Linux

## File format

```json
{
  "url": "https://example.com/article",
  "title": "Page Title",
  "text": "The full text content...",
  "timestamp": "2026-03-23T02:30:00.000Z",
  "type": "full_page"
}
```

## License

MIT
