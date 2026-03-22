# Send to Claude Code

Chrome extension that sends any webpage or selected text to a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) session.

Click the toolbar icon → pick a project → page content is saved and copied to clipboard. Then in Claude Code, just say *"read what I sent"* or:

```bash
cat /tmp/claude-page.json
```

The extension automatically detects your active Claude Code projects — no configuration needed.

## Setup

```bash
git clone https://github.com/sohil404/send-to-claude.git ~/send-to-claude
cd ~/send-to-claude
```

Then open this folder in Claude Code and say **"set this up"** — it will walk you through it. The only manual step is loading the extension in Chrome and copying the ID.

Or do it yourself:

1. Chrome → `chrome://extensions` → Developer Mode → Load unpacked → select the folder
2. Copy the Extension ID
3. `./install.sh <your-extension-id>`

## How it works

**Click the icon** → shows your recent Claude Code projects → pick one:
- "Full page" sends all text content
- "Selection" sends highlighted text only

**Right-click** highlighted text → "Send to Claude Code" → sends to your most recent project.

Content is saved to `/tmp/claude-page-{project}.json` and copied to your clipboard.

```
Chrome Extension ←→ Native Bridge (Python) ←→ ~/.claude/projects/
                                            ↓
                                  /tmp/claude-page-{project}.json
                                            ↓
                                      Claude Code
```

## Requirements

- Chrome, Brave, Edge, Arc, or any Chromium browser
- Python 3 (pre-installed on macOS and most Linux)
- Claude Code installed (`~/.claude/` must exist)
- macOS or Linux

## License

MIT
