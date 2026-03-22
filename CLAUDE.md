# Send to Claude Code — Setup Instructions

When the user asks you to set up or install this extension, follow these steps:

## Step 1: Clone (if not already cloned)

If this repo isn't already on disk, clone it:

```bash
git clone https://github.com/sohil404/send-to-claude.git ~/send-to-claude
```

## Step 2: Load the extension in Chrome

Tell the user:

> Open Chrome and go to `chrome://extensions`. Enable **Developer Mode** (toggle in the top-right). Click **Load unpacked** and select the `send-to-claude` folder. Then copy the **Extension ID** shown under the extension name and paste it here.

Wait for them to give you the Extension ID.

## Step 3: Run the install script

Once you have the extension ID, run:

```bash
cd ~/send-to-claude && ./install.sh <EXTENSION_ID>
```

Replace `<EXTENSION_ID>` with the actual ID the user gave you.

## Step 4: Restart Chrome

Tell the user to **quit and reopen Chrome** — native messaging host manifests are cached on launch.

## Step 5: Confirm

Tell the user:

> All set! Click the extension icon in your toolbar — you'll see your active Claude Code projects. Pick one to send the current page. Then in any Claude Code session, say "read what I sent" or run `cat /tmp/claude-page.json`.

## Reading sent pages

When the user says "read what I sent", "check the page", "read the page I sent", or similar:

```bash
cat /tmp/claude-page.json
```

The file contains `url`, `title`, `text`, `timestamp`, and `type` (full_page or selection).
