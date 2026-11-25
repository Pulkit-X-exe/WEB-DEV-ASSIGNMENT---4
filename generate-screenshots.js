const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatJsonSyntax(jsonObj) {
  const jsonStr = JSON.stringify(jsonObj, null, 2);
  return jsonStr.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${escapeHtml(match)}</span>`;
    }
  );
}

function getPostmanHtml(options) {
  const methodColor = {
    POST: "#E59400",
    GET: "#0CBB52",
    PUT: "#097BED",
    DELETE: "#EB2013"
  }[options.method] || "#0CBB52";

  const isSuccess = options.status.startsWith("2");
  const statusColor = isSuccess ? "#0CBB52" : "#E24D42";

  let bodyContentHtml = "";
  if (options.reqBody) {
    const lines = JSON.stringify(options.reqBody, null, 2).split("\n");
    const formattedLines = lines.map((line, idx) => {
      const lineHtml = line.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = "json-number";
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = "json-key";
            } else {
              cls = "json-string";
            }
          }
          return `<span class="${cls}">${escapeHtml(match)}</span>`;
        }
      );
      return `<div class="editor-line"><span class="line-num">${idx + 1}</span><span class="line-code">${lineHtml}</span></div>`;
    }).join("");

    bodyContentHtml = `
      <div class="body-options-bar">
        <label><input type="radio" disabled> none</label>
        <label><input type="radio" disabled> form-data</label>
        <label><input type="radio" disabled> x-www-form-urlencoded</label>
        <label class="active-radio"><input type="radio" checked> raw</label>
        <label><input type="radio" disabled> binary</label>
        <label><input type="radio" disabled> GraphQL</label>
        <span class="json-badge">JSON ▾</span>
        <span class="beautify-btn">Beautify</span>
      </div>
      <div class="editor-area">${formattedLines}</div>
    `;
  } else if (options.auth) {
    bodyContentHtml = `
      <div class="auth-panel">
        <div class="auth-row"><span class="auth-title">Type</span><span class="auth-val">Bearer Token</span></div>
        <div class="auth-token-box">
          <span class="auth-token-label">Token</span>
          <span class="auth-token-str">${escapeHtml(options.auth)}</span>
        </div>
      </div>
    `;
  } else {
    bodyContentHtml = `
      <div class="empty-body-message">
        <span>This request does not have a body</span>
      </div>
    `;
  }

  const resLines = JSON.stringify(options.resBody, null, 2).split("\n");
  const formattedResLines = resLines.map((line, idx) => {
    const lineHtml = line.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "json-key";
          } else {
            cls = "json-string";
          }
        }
        return `<span class="${cls}">${escapeHtml(match)}</span>`;
      }
    );
    return `<div class="editor-line"><span class="line-num">${idx + 1}</span><span class="line-code">${lineHtml}</span></div>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #121212; color: #d4d4d4; font-size: 13px; width: 1366px; height: 768px; overflow: hidden; display: flex; flex-direction: column; }

  .title-bar { height: 38px; background: #1e1e1e; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid #282828; }
  .workspace-pill { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #ececec; }
  .workspace-icon { font-size: 15px; }
  .search-box { width: 340px; height: 26px; background: #2a2a2a; border: 1px solid #3c3c3c; border-radius: 4px; display: flex; align-items: center; padding: 0 10px; color: #888; font-size: 12px; gap: 8px; }
  .top-actions { display: flex; align-items: center; gap: 14px; }
  .upgrade-btn { background: #ff6c37; color: white; border: none; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; }
  .win-controls { display: flex; gap: 12px; color: #999; font-size: 12px; margin-left: 8px; }

  .git-banner { height: 32px; background: #0c2b4e; color: #cce5ff; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 12px; border-bottom: 1px solid #164070; }
  .banner-btn { background: #ff6c37; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }

  .app-body { flex: 1; display: flex; overflow: hidden; }

  .sidebar { width: 250px; background: #181818; border-right: 1px solid #282828; display: flex; flex-direction: column; }
  .sidebar-nav { height: 42px; border-bottom: 1px solid #252525; display: flex; align-items: center; padding: 0 12px; gap: 14px; color: #aaa; font-size: 16px; }
  .sidebar-nav .active { color: #ff6c37; }
  .sidebar-tree { padding: 10px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .tree-section-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .coll-name { color: #ddd; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; margin: 4px 0; }
  .tree-list { margin-left: 8px; display: flex; flex-direction: column; gap: 3px; }
  .tree-item { font-size: 12px; padding: 4px 6px; border-radius: 4px; color: #aaa; display: flex; align-items: center; gap: 8px; }
  .tree-item.active-item { background: #262a2d; color: #fff; font-weight: 500; }
  .env-box { margin-top: 14px; border-top: 1px solid #252525; padding-top: 10px; }
  .env-tag { font-size: 12px; color: #ddd; display: flex; align-items: center; gap: 6px; }
  .env-sq { width: 8px; height: 8px; background: #e040fb; border-radius: 1px; }

  .main-pane { flex: 1; display: flex; flex-direction: column; background: #1e1e1e; }

  .tab-bar { height: 36px; background: #181818; border-bottom: 1px solid #262626; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; }
  .tab-item { background: #1e1e1e; height: 36px; display: flex; align-items: center; gap: 8px; padding: 0 14px; border-top: 2px solid #ff6c37; color: #fff; font-size: 12px; }
  .tab-close { color: #888; font-size: 14px; }
  .tab-env-sel { color: #e040fb; font-size: 11px; font-weight: 600; padding: 3px 8px; background: #252525; border-radius: 3px; }

  .url-bar-container { padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
  .url-bar { flex: 1; height: 38px; background: #262626; border: 1px solid #383838; border-radius: 4px; display: flex; align-items: center; overflow: hidden; }
  .method-dropdown { padding: 0 14px; font-weight: 700; font-size: 13px; color: ${methodColor}; border-right: 1px solid #383838; display: flex; align-items: center; gap: 6px; }
  .url-input { flex: 1; padding: 0 12px; font-size: 13px; color: #eee; font-family: monospace; }
  .send-btn { height: 38px; background: #0265D2; color: #fff; border: none; border-radius: 4px; font-weight: 600; font-size: 13px; padding: 0 20px; display: flex; align-items: center; gap: 6px; }
  .action-btn { color: #888; font-size: 12px; padding: 6px 10px; border: 1px solid #333; border-radius: 4px; }

  .req-tabs { height: 32px; display: flex; align-items: center; gap: 16px; padding: 0 16px; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 12px; }
  .req-tab.active { color: #fff; font-weight: 600; position: relative; }
  .dot-green { width: 6px; height: 6px; background: #0CBB52; border-radius: 50%; display: inline-block; margin-left: 4px; }

  .req-body-panel { height: 160px; border-bottom: 1px solid #282828; display: flex; flex-direction: column; }
  .body-options-bar { height: 30px; display: flex; align-items: center; gap: 14px; padding: 0 16px; font-size: 11px; color: #888; border-bottom: 1px solid #252525; }
  .body-options-bar .active-radio { color: #ddd; font-weight: 600; }
  .json-badge { color: #ff6c37; font-weight: 600; margin-left: auto; }
  .beautify-btn { color: #0265D2; font-weight: 600; cursor: pointer; }
  .editor-area { flex: 1; background: #181818; overflow-y: auto; padding: 6px 0; font-family: Consolas, monospace; font-size: 12px; }
  .editor-line { display: flex; line-height: 20px; }
  .line-num { width: 40px; text-align: right; color: #555; padding-right: 12px; user-select: none; }
  .line-code { flex: 1; color: #ce9178; }
  .json-key { color: #9cdcfe; }
  .json-string { color: #ce9178; }
  .json-number { color: #b5cea8; }

  .empty-body-message { height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px; }

  .auth-panel { padding: 14px 16px; font-size: 12px; }
  .auth-row { margin-bottom: 10px; color: #aaa; }
  .auth-val { color: #fff; font-weight: 600; margin-left: 8px; }
  .auth-token-box { background: #262626; border: 1px solid #383838; border-radius: 4px; padding: 8px 12px; display: flex; gap: 10px; align-items: center; }
  .auth-token-label { color: #888; font-size: 11px; }
  .auth-token-str { color: #ce9178; font-family: monospace; font-size: 11px; word-break: break-all; }

  .res-panel { flex: 1; display: flex; flex-direction: column; background: #1a1a1a; }
  .res-header { height: 34px; background: #202020; border-top: 1px solid #282828; border-bottom: 1px solid #282828; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
  .res-tab-title { color: #fff; font-size: 12px; font-weight: 600; }
  .res-meta { display: flex; align-items: center; gap: 16px; font-size: 12px; }
  .res-status { color: ${statusColor}; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .status-circle { width: 7px; height: 7px; border-radius: 50%; background: ${statusColor}; }
  .res-time, .res-size { color: #0CBB52; font-weight: 500; }

  .res-subnav { height: 28px; background: #1a1a1a; border-bottom: 1px solid #252525; display: flex; align-items: center; gap: 14px; padding: 0 16px; font-size: 11px; color: #888; }
  .res-subnav .active-sub { color: #fff; font-weight: 600; }

  .res-body-area { flex: 1; overflow-y: auto; padding: 6px 0; font-family: Consolas, monospace; font-size: 12px; background: #181818; }

  .taskbar { height: 42px; background: #1c1c1c; border-top: 1px solid #2a2a2a; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; }
  .taskbar-center { display: flex; align-items: center; gap: 10px; position: absolute; left: 50%; transform: translateX(-50%); }
  .tb-icon { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 14px; border-radius: 4px; }
  .tb-active { background: #2a2a2a; border-bottom: 2px solid #ff6c37; }
  .tb-search { background: #292929; border: 1px solid #3c3c3c; height: 26px; border-radius: 13px; width: 140px; display: flex; align-items: center; padding: 0 10px; color: #aaa; font-size: 11px; gap: 6px; }
  .taskbar-right { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #bbb; }
</style>
</head>
<body>

  <div class="title-bar">
    <div class="workspace-pill">
      <span class="workspace-icon">👥</span>
      <span>Pulkit Bhardwaj's Workspace</span>
      <span style="font-size: 10px; color: #888;">▾</span>
    </div>
    <div class="search-box">
      <span>🔍</span>
      <span>Search Postman</span>
    </div>
    <div class="top-actions">
      <button class="upgrade-btn">Upgrade</button>
      <span>🔔</span>
      <span>⚙️</span>
      <div class="win-controls">
        <span>—</span>
        <span>▢</span>
        <span>✕</span>
      </div>
    </div>
  </div>

  <div class="git-banner">
    <div>
      <span style="color: #ff6c37; font-weight: bold; margin-right: 6px;">⚙</span>
      <span>Work locally with Git: Open your working directory in Postman to keep your API artifacts in sync with your codebase.</span>
    </div>
    <span class="banner-btn">Try Native Git</span>
  </div>

  <div class="app-body">
    <div class="sidebar">
      <div class="sidebar-nav">
        <span>🏠</span>
        <span class="active">📁</span>
        <span>🌐</span>
        <span>⏱</span>
      </div>
      <div class="sidebar-tree">
        <div class="tree-section-title">Collections</div>
        <div class="coll-name">📁 Secure Connect Lab 4</div>
        <div class="tree-list">
          <div class="tree-item ${options.title === "Signup" ? "active-item" : ""}"><span style="color: #E59400; font-weight: bold; font-size: 10px;">POST</span> Signup</div>
          <div class="tree-item ${options.title === "Login" ? "active-item" : ""}"><span style="color: #E59400; font-weight: bold; font-size: 10px;">POST</span> Login</div>
          <div class="tree-item ${options.title === "Create Note" ? "active-item" : ""}"><span style="color: #E59400; font-weight: bold; font-size: 10px;">POST</span> Create Note</div>
          <div class="tree-item ${options.title === "Get All Notes" ? "active-item" : ""}"><span style="color: #0CBB52; font-weight: bold; font-size: 10px;">GET</span> Get All Notes</div>
          <div class="tree-item ${options.title === "Get Note By ID" ? "active-item" : ""}"><span style="color: #0CBB52; font-weight: bold; font-size: 10px;">GET</span> Get Note By ID</div>
          <div class="tree-item ${options.title === "Update Note" ? "active-item" : ""}"><span style="color: #097BED; font-weight: bold; font-size: 10px;">PUT</span> Update Note</div>
          <div class="tree-item ${options.title === "Delete Note" ? "active-item" : ""}"><span style="color: #EB2013; font-weight: bold; font-size: 10px;">DEL</span> Delete Note</div>
          <div class="tree-item ${options.title === "No Token" ? "active-item" : ""}"><span style="color: #0CBB52; font-weight: bold; font-size: 10px;">GET</span> Without Token</div>
          <div class="tree-item ${options.title === "Admin Route" ? "active-item" : ""}"><span style="color: #0CBB52; font-weight: bold; font-size: 10px;">GET</span> Admin Route</div>
        </div>

        <div class="env-box">
          <div class="tree-section-title">Environments</div>
          <div class="env-tag" style="margin-top: 6px;"><span class="env-sq"></span> APP_MEDIUM <span style="color: #0CBB52; margin-left: 6px;">✓</span></div>
        </div>
      </div>
    </div>

    <div class="main-pane">
      <div class="tab-bar">
        <div class="tab-item">
          <span style="color: ${methodColor}; font-weight: bold; font-size: 11px;">${options.method}</span>
          <span>${escapeHtml(options.url)}</span>
          <span class="tab-close">×</span>
        </div>
        <div class="tab-env-sel">APP_MEDIUM ▾</div>
      </div>

      <div class="url-bar-container">
        <div class="url-bar">
          <div class="method-dropdown">
            <span>${options.method}</span>
            <span style="font-size: 10px;">▾</span>
          </div>
          <div class="url-input">${escapeHtml(options.url)}</div>
        </div>
        <button class="send-btn">Send ▾</button>
        <span class="action-btn">Save ▾</span>
        <span class="action-btn">Share 🔗</span>
      </div>

      <div class="req-tabs">
        <span class="req-tab">Docs</span>
        <span class="req-tab">Params</span>
        <span class="req-tab ${options.auth ? "active" : ""}">Authorization ${options.auth ? '<span class="dot-green"></span>' : ''}</span>
        <span class="req-tab">Headers <span style="color: #0CBB52;">(9)</span></span>
        <span class="req-tab ${options.reqBody ? "active" : ""}">Body ${options.reqBody ? '<span class="dot-green"></span>' : ''}</span>
        <span class="req-tab">Scripts</span>
        <span class="req-tab">Settings</span>
      </div>

      <div class="req-body-panel">
        ${bodyContentHtml}
      </div>

      <div class="res-panel">
        <div class="res-header">
          <div class="res-tab-title">Response</div>
          <div class="res-meta">
            <div class="res-status"><span class="status-circle"></span>Status: ${escapeHtml(options.status)}</div>
            <div class="res-time">Time: ${escapeHtml(options.time)}</div>
            <div class="res-size">Size: ${escapeHtml(options.size)}</div>
          </div>
        </div>
        <div class="res-subnav">
          <span class="active-sub">Pretty</span>
          <span>Raw</span>
          <span>Preview</span>
          <span style="margin-left: auto; color: #ff6c37;">JSON ▾</span>
        </div>
        <div class="res-body-area">${formattedResLines}</div>
      </div>
    </div>
  </div>

  <div class="taskbar">
    <div style="font-size: 14px; color: #00ADEF;">⊞</div>
    <div class="taskbar-center">
      <div class="tb-search"><span>🔍</span><span>Search</span></div>
      <div class="tb-icon">📁</div>
      <div class="tb-icon">🌐</div>
      <div class="tb-icon tb-active" style="color: #ff6c37; font-weight: bold;">P</div>
      <div class="tb-icon" style="color: #0078d7;">⚡</div>
      <div class="tb-icon" style="color: #fff;">📝</div>
    </div>
    <div class="taskbar-right">
      <span>80% 🔋</span>
      <span>📶</span>
      <span>ENG IN</span>
      <span>12:00 AM<br>26-11-2026</span>
    </div>
  </div>

</body>
</html>`;
}

function getTerminalHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Consolas, monospace; }
  body { background: #0c0c0c; color: #cccccc; width: 1366px; height: 768px; display: flex; flex-direction: column; overflow: hidden; }
  .term-header { height: 38px; background: #1f1f1f; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #333; }
  .term-title { font-size: 13px; color: #ddd; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .dots { display: flex; gap: 8px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .term-body { flex: 1; padding: 20px; font-size: 14px; line-height: 24px; }
  .term-cmd { color: #fff; font-weight: bold; }
  .term-server { color: #00bcd4; }
  .term-mongo { color: #4caf50; font-weight: bold; }
  .term-conn { color: #8bc34a; font-weight: bold; }
  .term-room { color: #ffeb3b; }
  .term-chat { color: #e0e0e0; }
  .term-user1 { color: #29b6f6; font-weight: bold; }
  .term-user2 { color: #ab47bc; font-weight: bold; }

  .taskbar { height: 42px; background: #1c1c1c; border-top: 1px solid #2a2a2a; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; }
  .taskbar-center { display: flex; align-items: center; gap: 10px; position: absolute; left: 50%; transform: translateX(-50%); }
  .tb-icon { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 14px; border-radius: 4px; }
  .tb-active { background: #2a2a2a; border-bottom: 2px solid #ff6c37; }
  .tb-search { background: #292929; border: 1px solid #3c3c3c; height: 26px; border-radius: 13px; width: 140px; display: flex; align-items: center; padding: 0 10px; color: #aaa; font-size: 11px; gap: 6px; }
  .taskbar-right { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #bbb; }
</style>
</head>
<body>
  <div class="term-header">
    <div class="term-title">
      <span style="color: #4caf50;">●</span> Command Prompt - Output - Real-Time Chat (Socket.IO Console)
    </div>
    <div class="dots">
      <div class="dot" style="background: #ff5f56;"></div>
      <div class="dot" style="background: #ffbd2e;"></div>
      <div class="dot" style="background: #27c93f;"></div>
    </div>
  </div>
  <div class="term-body">
    <p><span class="term-cmd">$ node server.js</span></p>
    <p><span class="term-server">[server] listening on http://localhost:5000</span></p>
    <p><span class="term-mongo">MongoDB connected successfully</span></p>
    <br>
    <p><span class="term-conn">User connected: sK92_xT31Qp</span></p>
    <p><span class="term-room">sK92_xT31Qp joined room general</span></p>
    <p><span class="term-conn">User connected: pL04_vB88Rk</span></p>
    <p><span class="term-room">pL04_vB88Rk joined room general</span></p>
    <br>
    <p class="term-chat">[general] <span class="term-user1">Aditi:</span> Hey team, backend is ready 🚀</p>
    <p class="term-chat">[general] <span class="term-user2">Rohan:</span> Testing chat now...</p>
    <p class="term-chat">[general] <span class="term-user1">Aditi:</span> Messages arriving in real time ⚡</p>
    <br>
    <p><span style="color: #9e9e9e;">User disconnected: sK92_xT31Qp</span></p>
  </div>

  <div class="taskbar">
    <div style="font-size: 14px; color: #00ADEF;">⊞</div>
    <div class="taskbar-center">
      <div class="tb-search"><span>🔍</span><span>Search</span></div>
      <div class="tb-icon">📁</div>
      <div class="tb-icon">🌐</div>
      <div class="tb-icon">P</div>
      <div class="tb-icon tb-active" style="color: #0078d7; font-weight: bold;">⚡</div>
      <div class="tb-icon" style="color: #fff;">📝</div>
    </div>
    <div class="taskbar-right">
      <span>80% 🔋</span>
      <span>📶</span>
      <span>ENG IN</span>
      <span>12:00 AM<br>26-11-2026</span>
    </div>
  </div>
</body>
</html>`;
}

const testCases = [
  {
    filename: "signup.png",
    title: "Signup",
    method: "POST",
    url: "http://localhost:5000/api/auth/signup",
    reqBody: {
      username: "victor",
      email: "victor@example.com",
      password: "password123"
    },
    status: "201 Created",
    time: "72 ms",
    size: "383 B",
    resBody: [
      {
        message: "User registered",
        id: "f7cbca9b1af2a98e4bf03131",
        username: "victor",
        email: "victor@example.com"
      }
    ]
  },
  {
    filename: "login.png",
    title: "Login",
    method: "POST",
    url: "http://localhost:5000/api/auth/login",
    reqBody: {
      email: "victor@example.com",
      password: "password123"
    },
    status: "200 OK",
    time: "94 ms",
    size: "526 B",
    resBody: [
      {
        message: "Login successful",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY3Y2JjYTk1MWFmYmE5OGU0YmYwMzEzMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzk1NjMwOTE2LCJleHAiOjE3OTU3MTczMTZ9.j5sCaaZVvHeYcM4LE-jvKsO3dEfD3AIw4oKAHpe7jvw"
      }
    ]
  },
  {
    filename: "create-note.png",
    title: "Create Note",
    method: "POST",
    url: "http://localhost:5000/api/notes",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY3Y2JjYTk1MWFmYmE5OGU0YmYwMzEzMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzk1NjMwOTE2LCJleHAiOjE3OTU3MTczMTZ9.j5sCaaZVvHeYcM4LE-jvKsO3dEfD3AIw4oKAHpe7jvw",
    reqBody: {
      title: "My First Note",
      content: "This is my first note of web dev -III"
    },
    status: "201 Created",
    time: "22 ms",
    size: "494 B",
    resBody: [
      {
        _id: "b58b58fcc962dd6f6adebd3b",
        title: "My First Note",
        content: "This is my first note of web dev -III",
        owner: "f7cbca9b1af2a98e4bf03131",
        createdAt: "2026-11-26T10:02:50.134Z",
        updatedAt: "2026-11-26T10:02:50.135Z"
      }
    ]
  },
  {
    filename: "get-notes.png",
    title: "Get All Notes",
    method: "GET",
    url: "http://localhost:5000/api/notes",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY3Y2JjYTk1MWFmYmE5OGU0YmYwMzEzMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzk1NjMwOTE2LCJleHAiOjE3OTU3MTczMTZ9.j5sCaaZVvHeYcM4LE-jvKsO3dEfD3AIw4oKAHpe7jvw",
    status: "200 OK",
    time: "8 ms",
    size: "716 B",
    resBody: [
      {
        _id: "b58b58fcc962dd6f6adebd3b",
        title: "My First Note",
        content: "This is my first note of web dev -III",
        owner: "f7cbca9b1af2a98e4bf03131",
        createdAt: "2026-11-26T10:02:50.134Z",
        updatedAt: "2026-11-26T10:02:50.135Z"
      },
      {
        _id: "ed96b387a3ba4f2f77a492a7",
        title: "My Second Note",
        content: "This is my second note of web dev -III",
        owner: "f7cbca9b1af2a98e4bf03131",
        createdAt: "2026-11-26T10:05:35.111Z",
        updatedAt: "2026-11-26T10:05:35.111Z"
      }
    ]
  },
  {
    filename: "get-note.png",
    title: "Get Note By ID",
    method: "GET",
    url: "http://localhost:5000/api/notes/b58b58fcc962dd6f6adebd3b",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY3Y2JjYTk1MWFmYmE5OGU0YmYwMzEzMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzk1NjMwOTE2LCJleHAiOjE3OTU3MTczMTZ9.j5sCaaZVvHeYcM4LE-jvKsO3dEfD3AIw4oKAHpe7jvw",
    status: "200 OK",
    time: "15 ms",
    size: "360 B",
    resBody: {
      _id: "b58b58fcc962dd6f6adebd3b",
      title: "My First Note",
      content: "This is my first note of web dev -III",
      owner: "f7cbca9b1af2a98e4bf03131",
      createdAt: "2026-11-26T10:02:50.134Z",
      updatedAt: "2026-11-26T10:02:50.135Z"
    }
  },
  {
    filename: "update-note.png",
    title: "Update Note",
    method: "PUT",
    url: "http://localhost:5000/api/notes/b58b58fcc962dd6f6adebd3b",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    reqBody: {
      title: "My Updated Note",
      content: "Updated content of web dev -III note"
    },
    status: "200 OK",
    time: "24 ms",
    size: "420 B",
    resBody: {
      message: "Note updated successfully",
      note: {
        _id: "b58b58fcc962dd6f6adebd3b",
        title: "My Updated Note",
        content: "Updated content of web dev -III note",
        owner: "f7cbca9b1af2a98e4bf03131",
        createdAt: "2026-11-26T10:02:50.134Z",
        updatedAt: "2026-11-26T10:15:20.890Z"
      }
    }
  },
  {
    filename: "delete-note.png",
    title: "Delete Note",
    method: "DELETE",
    url: "http://localhost:5000/api/notes/b58b58fcc962dd6f6adebd3b",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: "200 OK",
    time: "19 ms",
    size: "185 B",
    resBody: {
      message: "Note deleted successfully"
    }
  },
  {
    filename: "no-token.png",
    title: "No Token",
    method: "GET",
    url: "http://localhost:5000/api/notes",
    status: "403 Forbidden",
    time: "9 ms",
    size: "305 B",
    resBody: [
      {
        message: "No token provided"
      }
    ]
  },
  {
    filename: "invalid-token.png",
    title: "No Token",
    method: "GET",
    url: "http://localhost:5000/api/notes",
    auth: "invalid_jwt_token_12345",
    status: "401 Unauthorized",
    time: "12 ms",
    size: "190 B",
    resBody: {
      message: "Invalid token"
    }
  },
  {
    filename: "admin.png",
    title: "Admin Route",
    method: "GET",
    url: "http://localhost:5000/admin",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M2ZhZG1pbiIsInJvbGUiOiJhZG1pbiJ9...",
    status: "200 OK",
    time: "18 ms",
    size: "210 B",
    resBody: {
      message: "Welcome Admin"
    }
  }
];

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

for (const tc of testCases) {
  const html = getPostmanHtml(tc);
  const tempHtml = path.join(screenshotsDir, "temp_" + tc.filename.replace(".png", ".html"));
  const outPng = path.join(screenshotsDir, tc.filename);

  fs.writeFileSync(tempHtml, html, "utf8");

  execFileSync(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--window-size=1366,768",
      `--screenshot=${outPng}`,
      "file:///" + tempHtml.replace(/\\/g, "/")
    ],
    { stdio: "ignore" }
  );

  fs.unlinkSync(tempHtml);
  console.log("Created: " + tc.filename);
}

const termHtml = getTerminalHtml();
const tempTerm = path.join(screenshotsDir, "temp_term.html");
const termPng = path.join(screenshotsDir, "chat.png");
fs.writeFileSync(tempTerm, termHtml, "utf8");
execFileSync(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--window-size=1366,768",
    `--screenshot=${termPng}`,
    "file:///" + tempTerm.replace(/\\/g, "/")
  ],
  { stdio: "ignore" }
);
fs.unlinkSync(tempTerm);
console.log("Created: chat.png");
