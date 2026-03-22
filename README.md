# Send to Claude Code

**Stop copy-pasting webpages into your terminal like a caveman.**

A Chrome extension that sends any webpage — or just a selection — directly to a specific Claude Code session. It auto-detects your active projects. Two clicks and you're done.

<br>

## The problem

You're deep in a Claude Code session. You find a GitHub issue, a Stack Overflow answer, some docs — and you need Claude to read it.

So you Cmd+A, Cmd+C, switch to your terminal, paste a wall of text, and hope the formatting doesn't break.

Every. Single. Time.

## The fix

Click the extension icon. Your active Claude Code projects appear — it reads `~/.claude/projects/` automatically. Pick one.

The page content lands in `/tmp/claude-page-{project}.json` and gets copied to your clipboard.

In Claude Code, just say:

```
read what I sent from Chrome
```

Or:

```bash
cat /tmp/claude-page.json
```

That's it. Full page or selection. Works with right-click too.

<br>

## Setup

```bash
git clone https://github.com/sohil404/send-to-claude.git ~/send-to-claude
cd ~/send-to-claude
```

**Option A — let Claude do it:**

Open the folder in Claude Code and say **"set this up"**. It reads the CLAUDE.md and handles everything.

**Option B — do it yourself (3 steps):**

1. `chrome://extensions` → Developer Mode → Load unpacked → select the folder
2. Copy the Extension ID
3. `./install.sh <your-extension-id>`

Reload the extension. Done forever.

<br>

## How it works

```
┌──────────┐    ┌──────────────┐    ┌─────────────────┐
│  Chrome  │───▶│ Native Bridge│───▶│ /tmp/claude-page │
│Extension │    │  (Python)    │    │   -{project}.json│
└──────────┘    └──────┬───────┘    └────────┬─────────┘
                       │                     │
                       ▼                     ▼
               ~/.claude/projects/     Claude Code
              (detects active sessions)  (reads the file)
```

- **No server.** No background process. The bridge runs on-demand when you click and exits immediately.
- **No dependencies.** Just Python 3 (pre-installed on macOS and most Linux).
- **No config.** It finds your Claude Code sessions by scanning `~/.claude/projects/` for recently active session files.

<br>

## Features

| Feature | How |
|---|---|
| Send full page | Click icon → pick project |
| Send selection | Highlight text → right-click → "Send to Claude Code" |
| Auto-detect sessions | Reads `~/.claude/projects/`, sorted by recency |
| Clipboard copy | Content is always copied to clipboard too |
| Works everywhere | Chrome, Brave, Edge, Arc — macOS & Linux |

<br>

## What Claude receives

```json
{
  "url": "https://github.com/anthropics/claude-code/issues/36885",
  "title": "Notification when Claude Code is waiting for user input",
  "text": "The full page content...",
  "timestamp": "2026-03-23T02:30:00.000Z",
  "type": "full_page",
  "project": "brain"
}
```

<br>

## Built with Claude Code

This entire extension — the popup UI, the native bridge, the session detection, the icon — was built in a single Claude Code session. The CLAUDE.md in this repo means Claude can set it up for you too.

<br>

## License

MIT
