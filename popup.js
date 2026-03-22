document.getElementById("btn-page").addEventListener("click", () => send("page"));
document.getElementById("btn-selection").addEventListener("click", () => send("selection"));

async function send(mode) {
  const content = document.getElementById("content");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let text;

    if (mode === "selection") {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString(),
      });
      text = result?.result;
      if (!text) {
        showResult(content, false, "No text selected", "Highlight text on the page first");
        return;
      }
    } else {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText,
      });
      text = result?.result || "";
    }

    // Copy to clipboard
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t) => navigator.clipboard.writeText(t),
      args: [text],
    });

    // Send via background → native host
    const response = await chrome.runtime.sendMessage({
      action: "send",
      data: {
        url: tab.url,
        title: tab.title,
        text,
        type: mode === "selection" ? "selection" : "full_page",
      },
    });

    const chars = text.length > 1000
      ? `${(text.length / 1000).toFixed(1)}k chars`
      : `${text.length} chars`;

    if (response?.ok) {
      showResult(content, true, "Sent to Claude Code", `${mode === "selection" ? "Selection" : "Full page"} · ${chars} · copied to clipboard`);
      setTimeout(() => window.close(), 1500);
    } else {
      showResult(content, false, "Native host not found", "Run the install script first — see README");
    }
  } catch (e) {
    showResult(content, false, "Error", e.message);
  }
}

function showResult(el, ok, msg, detail) {
  el.innerHTML = `
    <div class="result ${ok ? "ok" : "err"}">
      ${ok ? '<div class="check">&#10003;</div>' : ""}
      <div class="msg">${esc(msg)}</div>
      ${detail ? `<div class="detail">${esc(detail)}</div>` : ""}
    </div>
  `;
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
