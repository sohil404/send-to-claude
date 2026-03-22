const HOST = "com.sendtoclaude.bridge";

// Context menu for right-click selections
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-selection",
    title: "Send to Claude Code",
    contexts: ["selection"],
  });
});

// Context menu → send to most recent project
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "send-selection" || !info.selectionText) return;

  try {
    // Get most recent project
    const listResponse = await chrome.runtime.sendNativeMessage(HOST, { action: "list" });
    const project = listResponse.projects?.[0]?.name || "default";

    // Copy to clipboard
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t) => navigator.clipboard.writeText(t),
      args: [info.selectionText],
    });

    // Write file
    await chrome.runtime.sendNativeMessage(HOST, {
      action: "send",
      project,
      url: tab.url,
      title: tab.title,
      text: info.selectionText,
      type: "selection",
      timestamp: new Date().toISOString(),
    });

    showBadge("OK");
  } catch {
    showBadge("ERR");
  }
});

function showBadge(text) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({
    color: text === "OK" ? "#22c55e" : "#ef4444",
  });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
}
