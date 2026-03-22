const HOST_NAME = "com.sendtoclaude.bridge";

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-selection",
    title: "Send selection to Claude Code",
    contexts: ["selection"],
  });
});

// Context menu → send selection
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "send-selection" || !info.selectionText) return;

  await sendData({
    url: tab.url,
    title: tab.title,
    text: info.selectionText,
    type: "selection",
  });
});

// Called from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "send") {
    sendData(msg.data).then((ok) => sendResponse({ ok }));
    return true; // async
  }
});

async function sendData(data) {
  const payload = {
    url: data.url || "",
    title: data.title || "",
    text: data.text || "",
    timestamp: new Date().toISOString(),
    type: data.type || "full_page",
  };

  try {
    await chrome.runtime.sendNativeMessage(HOST_NAME, payload);
    showBadge("OK");
    return true;
  } catch (e) {
    console.error("Native host error:", e);
    showBadge("ERR");
    return false;
  }
}

function showBadge(text) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({
    color: text === "OK" ? "#22c55e" : "#ef4444",
  });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
}
