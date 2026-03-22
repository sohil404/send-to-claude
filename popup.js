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
  const count = document.getElementById("count");

  try {
    const response = await chrome.runtime.sendNativeMessage(HOST, { action: "list" });

    if (response.error) throw new Error(response.error);

    const projects = response.projects || [];
    count.textContent = projects.length ? `${projects.length}` : "";

    if (projects.length === 0) {
      content.innerHTML = '<div class="msg">No recent Claude Code sessions.<br>Open a project in Claude Code first.</div>';
      return;
    }

    content.innerHTML = '<div id="projects"></div>';
    const list = document.getElementById("projects");

    for (const p of projects) {
      const initial = p.name.charAt(0).toUpperCase();
      const shortPath = shortenPath(p.path);
      const div = document.createElement("div");
      div.className = "project";
      div.innerHTML = `
        <div class="icon">${esc(initial)}</div>
        <div class="info">
          <div class="name">${esc(p.name)}</div>
          <div class="path">${esc(shortPath)}</div>
        </div>
        <span class="ago">${esc(p.ago)}</span>
      `;
      div.addEventListener("click", () => sendTo(p.name));
      list.appendChild(div);
    }

  } catch (e) {
    count.textContent = "";
    const msg = e.message || String(e);

    if (msg.includes("not found") || msg.includes("native messaging host")) {
      content.innerHTML = `<div class="msg">
        Run this once in your terminal to finish setup:
        <code>./install.sh</code>
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
        showResult(content, false, "No text selected", "Highlight text on the page first");
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
    await chrome.runtime.sendNativeMessage(HOST, {
      action: "send",
      project,
      url: tab.url,
      title: tab.title,
      text,
      type: mode === "selection" ? "selection" : "full_page",
      timestamp: new Date().toISOString(),
    });

    const chars = text.length > 1000
      ? `${(text.length / 1000).toFixed(1)}k`
      : `${text.length}`;

    showResult(content, true, `Sent to ${project}`, `${chars} chars copied`);

    chrome.action.setBadgeText({ text: "OK" });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
      window.close();
    }, 1000);

  } catch (e) {
    showResult(content, false, "Failed to send", e.message);
  }
}

function showResult(el, ok, msg, detail) {
  if (ok) {
    el.innerHTML = `
      <div class="result">
        <div class="check">
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div class="label">${esc(msg)}</div>
        ${detail ? `<div class="detail">${esc(detail)}</div>` : ""}
      </div>`;
  } else {
    el.innerHTML = `
      <div class="result err">
        <div class="label">${esc(msg)}</div>
        ${detail ? `<div class="detail">${esc(detail)}</div>` : ""}
      </div>`;
  }
}

function shortenPath(p) {
  if (!p) return "";
  return p.replace(/^\/Users\/[^/]+\//, "~/").replace(/^\/Volumes\/[^/]+\//, "");
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}
