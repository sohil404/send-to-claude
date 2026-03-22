const HOST = "com.sendtoclaude.bridge";
let mode = "page";

document.getElementById("btn-page").addEventListener("click", () => setMode("page"));
document.getElementById("btn-sel").addEventListener("click", () => setMode("selection"));

function setMode(m) {
  mode = m;
  document.getElementById("btn-page").classList.toggle("active", m === "page");
  document.getElementById("btn-sel").classList.toggle("active", m === "selection");
}

init();

async function init() {
  const content = document.getElementById("content");
  const dot = document.getElementById("dot");
  const count = document.getElementById("count");

  try {
    const response = await chrome.runtime.sendNativeMessage(HOST, { action: "list" });

    if (response.error) throw new Error(response.error);

    const projects = response.projects || [];
    dot.className = "dot on";
    count.textContent = `${projects.length} project${projects.length !== 1 ? "s" : ""}`;

    if (projects.length === 0) {
      content.innerHTML = '<div class="msg">No recent Claude Code sessions.<br>Open a project in Claude Code first.</div>';
      return;
    }

    content.innerHTML = "";
    const list = document.createElement("div");
    list.id = "projects";

    for (const p of projects) {
      const div = document.createElement("div");
      div.className = "project";
      div.innerHTML = `
        <span class="name">${esc(p.name)}</span>
        <span class="ago">${esc(p.ago)}</span>
      `;
      div.addEventListener("click", () => sendTo(p.name));
      list.appendChild(div);
    }

    content.appendChild(list);

  } catch (e) {
    dot.className = "dot off";
    count.textContent = "";
    const msg = e.message || String(e);

    if (msg.includes("Specified native messaging host not found") || msg.includes("not found")) {
      content.innerHTML = `<div class="msg">
        Native host not installed yet.<br>
        Run this once in your terminal:
        <code>cd ${esc(getRepoHint())} && ./install.sh</code>
      </div>`;
    } else {
      content.innerHTML = `<div class="msg">${esc(msg)}</div>`;
    }
  }
}

async function sendTo(project) {
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
        showResult(content, false, "No text selected");
        setTimeout(() => init(), 1500);
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

    // Write file via native host
    const response = await chrome.runtime.sendNativeMessage(HOST, {
      action: "send",
      project,
      url: tab.url,
      title: tab.title,
      text,
      type: mode === "selection" ? "selection" : "full_page",
      timestamp: new Date().toISOString(),
    });

    const chars = text.length > 1000
      ? `${(text.length / 1000).toFixed(1)}k chars`
      : `${text.length} chars`;

    showResult(content, true, `Sent to ${project}`, `${chars} · copied to clipboard`);
    chrome.action.setBadgeText({ text: "OK" });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
      window.close();
    }, 1200);

  } catch (e) {
    showResult(content, false, e.message);
  }
}

function showResult(el, ok, msg, detail) {
  el.innerHTML = `
    <div class="result${ok ? "" : " err"}">
      ${ok ? '<div class="check">&#10003;</div>' : ""}
      <div class="label">${esc(msg)}</div>
      ${detail ? `<div class="detail">${esc(detail)}</div>` : ""}
    </div>`;
}

function getRepoHint() {
  // Best-effort hint for where the extension is loaded from
  return chrome.runtime.getURL("").replace("chrome-extension://", "").split("/")[0]
    ? "send-to-claude" : "send-to-claude";
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}
