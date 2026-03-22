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
        show(content, false, "No text selected");
        return;
      }
    } else {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText,
      });
      text = result?.result || "";
    }

    // Format as markdown with source
    const type = mode === "selection" ? "selection" : "full_page";
    const header = type === "selection"
      ? `> Selected from [${tab.title}](${tab.url})\n\n`
      : `> Source: [${tab.title}](${tab.url})\n\n`;
    const md = header + text;

    // Copy via background script (more reliable across origins)
    await chrome.runtime.sendMessage({
      action: "copy",
      tabId: tab.id,
      md,
    });

    const chars = text.length > 1000
      ? `${(text.length / 1000).toFixed(1)}k chars`
      : `${text.length} chars`;

    show(content, true, "Copied!", chars + " — paste into Claude Code");
    setTimeout(() => window.close(), 1200);

  } catch (e) {
    show(content, false, e.message);
  }
}

function show(el, ok, msg, detail) {
  el.innerHTML = `
    <div class="result${ok ? "" : " err"}">
      ${ok ? '<div class="check">&#10003;</div>' : ""}
      <div class="msg">${esc(msg)}</div>
      ${detail ? `<div class="detail">${esc(detail)}</div>` : ""}
    </div>`;
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
