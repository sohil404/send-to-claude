// Context menu for selections
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-selection",
    title: "Send to Claude Code",
    contexts: ["selection"],
  });
});

// Context menu → copy selection as markdown
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "send-selection" || !info.selectionText) return;

  const md = formatMarkdown(tab.url, tab.title, info.selectionText, "selection");

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => navigator.clipboard.writeText(text),
    args: [md],
  });

  showBadge();
});

// Messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "copy") {
    copyToClipboard(msg.tabId, msg.md).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function copyToClipboard(tabId, md) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (text) => navigator.clipboard.writeText(text),
    args: [md],
  });
  showBadge();
}

function formatMarkdown(url, title, text, type) {
  const header = type === "selection"
    ? `> Selected from [${title}](${url})\n\n`
    : `> Source: [${title}](${url})\n\n`;
  return header + text;
}

function showBadge() {
  chrome.action.setBadgeText({ text: "OK" });
  chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
}
