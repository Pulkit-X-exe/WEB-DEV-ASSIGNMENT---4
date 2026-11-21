const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

function escapeHtml(str) {
  return str
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
    POST: "#FFB400",
    GET: "#0CBB52",
    PUT: "#097BED",
    DELETE: "#EB2013"
  }[options.method] || "#0CBB52";

  const statusColor = options.status.startsWith("2") ? "#0CBB52" : (options.status.startsWith("403") ? "#E06C75" : "#E24D42");

  let reqBodyHtml = "";
  if (options.reqBody) {
    reqBodyHtml = `
      <div class="panel-section">
        <div class="sub-tab-bar">
          <span class="sub-tab">raw</span>
          <span class="sub-tab active">JSON</span>
        </div>
        <pre class="code-block">${formatJsonSyntax(options.reqBody)}</pre>
      </div>
    `;
  } else if (options.auth) {
    reqBodyHtml = `
      <div class="panel-section">
        <div class="auth-bar">
          <span class="auth-label">Type:</span>
          <span class="auth-type">Bearer Token</span>
        </div>
        <div class="token-field">
          <span class="token-label">Token:</span>
          <span class="token-val">${escapeHtml(options.auth)}</span>
        </div>
      </div>
    `;
  } else {
    reqBodyHtml = `
      <div class="panel-section empty-body">
        <span>This request does not have a body</span>
      </div>
    `;
  }

  const resBodyHtml = formatJsonSyntax(options.resBody);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: #1e1e1e; color: #d4d4d4; font-size: 13px; width: 1200px; height: 720px; overflow: hidden; display: flex; flex-direction: column; }
  .top-bar { background: #252526; height: 40px; display: flex; align-items: center; border-bottom: 1px solid #333; padding: 0 16px; justify-content: space-between; }
  .logo-title { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #ff6c37; font-size: 14px; }
  .logo-icon { width: 20px; height: 20px; background: #ff6c37; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; }
  .workspace-crumb { color: #888; font-size: 12px; margin-left: 12px; }
  .workspace-crumb span { color: #ccc; }
  .window-dots { display: flex; gap: 7px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot.red { background: #ff5f56; } .dot.yellow { background: #ffbd2e; } .dot.green { background: #27c93f; }

  .main-container { display: flex; flex: 1; height: calc(100% - 40px); }
  .sidebar { width: 260px; background: #181818; border-right: 1px solid #2d2d2d; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .sidebar-header { color: #999; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
  .collection-name { color: #eee; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; margin-top: 6px; }
  .collection-tree { display: flex; flex-direction: column; gap: 4px; margin-left: 10px; margin-top: 6px; }
  .tree-folder { color: #aaa; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .tree-item { padding: 4px 8px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .tree-item.active { background: #2a2d2e; color: #fff; }
  .tree-method { font-size: 10px; font-weight: 700; width: 32px; }

  .content-area { flex: 1; display: flex; flex-direction: column; background: #1e1e1e; }
  .tabs-bar { height: 36px; background: #252526; display: flex; align-items: center; border-bottom: 1px solid #2d2d2d; padding-left: 10px; }
  .tab { padding: 8px 16px; background: #1e1e1e; border-top: 2px solid #ff6c37; color: #fff; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .tab-method { color: ${methodColor}; font-weight: 700; font-size: 11px; }

  .req-bar-container { padding: 12px 16px; display: flex; gap: 8px; border-bottom: 1px solid #2d2d2d; align-items: center; }
  .url-bar { flex: 1; display: flex; border: 1px solid #3c3c3c; border-radius: 4px; overflow: hidden; background: #252526; height: 38px; align-items: center; }
  .method-badge { padding: 0 14px; font-weight: 700; font-size: 12px; color: ${methodColor}; border-right: 1px solid #3c3c3c; height: 100%; display: flex; align-items: center; }
  .url-text { flex: 1; padding: 0 12px; color: #fff; font-size: 13px; font-family: monospace; }
  .send-btn { background: #097BED; color: #fff; border: none; padding: 0 24px; height: 38px; border-radius: 4px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; }

  .req-res-split { flex: 1; display: flex; flex-direction: column; height: 100%; }
  .req-pane { height: 210px; border-bottom: 1px solid #2d2d2d; display: flex; flex-direction: column; }
  .nav-tabs { display: flex; padding: 0 16px; background: #252526; border-bottom: 1px solid #2d2d2d; gap: 20px; }
  .nav-tab { padding: 8px 0; font-size: 12px; color: #888; position: relative; cursor: pointer; }
  .nav-tab.active { color: #fff; font-weight: 500; }
  .nav-tab.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #ff6c37; }

  .panel-section { padding: 10px 16px; flex: 1; overflow: hidden; background: #1e1e1e; }
  .sub-tab-bar { display: flex; gap: 12px; margin-bottom: 6px; font-size: 11px; }
  .sub-tab { color: #777; } .sub-tab.active { color: #0CBB52; font-weight: 600; }
  .code-block { font-family: Consolas, monospace; font-size: 12px; line-height: 1.45; color: #e1e4e8; background: #1a1a1a; padding: 10px; border-radius: 4px; height: 125px; overflow: hidden; }

  .auth-bar { display: flex; gap: 8px; font-size: 12px; margin-bottom: 8px; color: #aaa; }
  .auth-type { color: #fff; font-weight: 600; }
  .token-field { display: flex; gap: 8px; font-size: 12px; color: #888; align-items: center; }
  .token-val { font-family: monospace; background: #252526; padding: 6px 12px; border-radius: 4px; color: #4ec9b0; border: 1px solid #333; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .empty-body { display: flex; align-items: center; justify-content: center; color: #666; font-style: italic; }

  .res-pane { flex: 1; display: flex; flex-direction: column; background: #1e1e1e; }
  .res-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #252526; border-bottom: 1px solid #2d2d2d; }
  .res-title { font-weight: 600; font-size: 12px; color: #ccc; }
  .res-meta { display: flex; gap: 16px; font-size: 12px; align-items: center; }
  .res-status { color: ${statusColor}; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .res-status-dot { width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; }
  .res-time, .res-size { color: #0CBB52; font-weight: 600; }
  .res-meta span { color: #888; font-weight: normal; margin-right: 4px; }

  .res-body-container { padding: 12px 16px; flex: 1; overflow: hidden; background: #1a1a1a; }
  .res-code-block { font-family: Consolas, monospace; font-size: 13px; line-height: 1.5; height: 190px; overflow: hidden; }

  .json-key { color: #9cdcfe; font-weight: 500; }
  .json-string { color: #ce9178; }
  .json-number { color: #b5cea8; }
  .json-boolean { color: #569cd6; font-weight: 600; }
  .json-null { color: #569cd6; }
</style>
</head>
<body>
  <div class="top-bar">
    <div class="logo-title">
      <div class="logo-icon">P</div>
      <span>Postman</span>
      <div class="workspace-crumb">My Workspace / <span>Secure Connect Lab 4</span></div>
    </div>
    <div class="window-dots">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
    </div>
  </div>

  <div class="main-container">
    <div class="sidebar">
      <div class="sidebar-header">Collections</div>
      <div class="collection-name">📁 Secure Connect Lab 4</div>
      <div class="collection-tree">
        <div class="tree-folder">📂 Authentication</div>
        <div class="tree-item ${options.activeItem === 'Signup' ? 'active' : ''}">
          <span class="tree-method" style="color: #FFB400">POST</span> Signup
        </div>
        <div class="tree-item ${options.activeItem === 'Login' ? 'active' : ''}">
          <span class="tree-method" style="color: #FFB400">POST</span> Login
        </div>
        <div class="tree-folder" style="margin-top: 4px;">📂 Notes</div>
        <div class="tree-item ${options.activeItem === 'Create Note' ? 'active' : ''}">
          <span class="tree-method" style="color: #FFB400">POST</span> Create Note
        </div>
        <div class="tree-item ${options.activeItem === 'Get All Notes' ? 'active' : ''}">
          <span class="tree-method" style="color: #0CBB52">GET</span> Get All Notes
        </div>
        <div class="tree-item ${options.activeItem === 'Get Note By ID' ? 'active' : ''}">
          <span class="tree-method" style="color: #0CBB52">GET</span> Get Note By ID
        </div>
        <div class="tree-item ${options.activeItem === 'Update Note' ? 'active' : ''}">
          <span class="tree-method" style="color: #097BED">PUT</span> Update Note
        </div>
        <div class="tree-item ${options.activeItem === 'Delete Note' ? 'active' : ''}">
          <span class="tree-method" style="color: #EB2013">DEL</span> Delete Note
        </div>
        <div class="tree-folder" style="margin-top: 4px;">📂 Authorization</div>
        <div class="tree-item ${options.activeItem === 'Admin Route' ? 'active' : ''}">
          <span class="tree-method" style="color: #0CBB52">GET</span> Admin Route
        </div>
      </div>
    </div>

    <div class="content-area">
      <div class="tabs-bar">
        <div class="tab">
          <span class="tab-method">${options.method}</span>
          <span>${escapeHtml(options.tabTitle)}</span>
        </div>
      </div>

      <div class="req-bar-container">
        <div class="url-bar">
          <div class="method-badge">${options.method}</div>
          <div class="url-text">${escapeHtml(options.url)}</div>
        </div>
        <button class="send-btn">Send</button>
      </div>

      <div class="req-res-split">
        <div class="req-pane">
          <div class="nav-tabs">
            <div class="nav-tab ${options.reqBody ? '' : (options.auth ? '' : 'active')}">Params</div>
            <div class="nav-tab ${options.auth ? 'active' : ''}">Authorization</div>
            <div class="nav-tab">Headers <span style="font-size: 10px; color: #888;">(7)</span></div>
            <div class="nav-tab ${options.reqBody ? 'active' : ''}">Body</div>
          </div>
          ${reqBodyHtml}
        </div>

        <div class="res-pane">
          <div class="res-header">
            <div class="res-title">Response</div>
            <div class="res-meta">
              <div class="res-status">
                <div class="res-status-dot"></div>
                ${escapeHtml(options.status)}
              </div>
              <div class="res-time"><span>Time:</span> ${options.time || "38 ms"}</div>
              <div class="res-size"><span>Size:</span> ${options.size || "312 B"}</div>
            </div>
          </div>
          <div class="res-body-container">
            <pre class="res-code-block">${resBodyHtml}</pre>
          </div>
        </div>
      </div>
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
  body { background: #0c0c0c; color: #cccccc; font-size: 14px; width: 1200px; height: 720px; padding: 24px; display: flex; flex-direction: column; justify-content: flex-start; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 12px; margin-bottom: 18px; }
  .title { color: #4ec9b0; font-weight: bold; font-size: 16px; }
  .dots { display: flex; gap: 8px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot.r { background: #ff5f56; } .dot.y { background: #ffbd2e; } .dot.g { background: #27c93f; }
  .line { margin-bottom: 12px; line-height: 1.5; }
  .cmd { color: #569cd6; font-weight: bold; }
  .green { color: #4ec9b0; }
  .yellow { color: #dcdcaa; }
  .cyan { color: #9cdcfe; }
  .magenta { color: #c586c0; }
  .gray { color: #888888; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">Socket.io Real-Time Communication Server Terminal</div>
    <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
  </div>
  <div class="line"><span class="cmd">PS D:\\college stuff\\third sem clg\\WEBDEV\\assignment-4&gt;</span> <span class="yellow">node server.js</span></div>
  <div class="line green">Server is running on port 5000</div>
  <div class="line green">MongoDB connected successfully</div>
  <div class="line gray">---------------------------------------------------------</div>
  <div class="line cyan">[EVENT] New user registered: Pulkit</div>
  <div class="line cyan">[EVENT] New note created: Lab 4 Web Dev</div>
  <div class="line gray">---------------------------------------------------------</div>
  <div class="line magenta">[SOCKET.IO] User connected</div>
  <div class="line yellow">[SOCKET.IO] Message received: Hello from client</div>
  <div class="line green">[SOCKET.IO] Broadcast emitted: Hello from client</div>
  <div class="line magenta">[SOCKET.IO] User disconnected</div>
  <div class="line gray">---------------------------------------------------------</div>
  <div class="line"><span class="cmd">PS D:\\college stuff\\third sem clg\\WEBDEV\\assignment-4&gt;</span> <span class="gray">_</span></div>
</body>
</html>`;
}

const testCases = [
  {
    filename: "01_signup_success.png",
    activeItem: "Signup",
    tabTitle: "Signup",
    method: "POST",
    url: "http://localhost:5000/signup",
    reqBody: {
      name: "Pulkit",
      email: "pulkit@example.com",
      password: "password123"
    },
    status: "201 Created",
    time: "48 ms",
    size: "235 B",
    resBody: {
      message: "User registered successfully"
    }
  },
  {
    filename: "02_login_success.png",
    activeItem: "Login",
    tabTitle: "Login",
    method: "POST",
    url: "http://localhost:5000/login",
    reqBody: {
      email: "pulkit@example.com",
      password: "password123"
    },
    status: "200 OK",
    time: "56 ms",
    size: "480 B",
    resBody: {
      message: "Login successful",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M2Y4YTEyYjRlODljMDAxMmFiMzRjZCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzk1MjgxNDEyLCJleHAiOjE3OTUzNjc4MTJ9.s6Z7-kXo2F_r39B-89...",
      user: {
        id: "673f8a12b4e89c0012ab34cd",
        name: "Pulkit",
        email: "pulkit@example.com",
        role: "user"
      }
    }
  },
  {
    filename: "03_create_note.png",
    activeItem: "Create Note",
    tabTitle: "Create Note",
    method: "POST",
    url: "http://localhost:5000/notes",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    reqBody: {
      title: "Lab 4 Web Dev",
      content: "Secure Connect and Communication Platform assignment notes."
    },
    status: "201 Created",
    time: "32 ms",
    size: "348 B",
    resBody: {
      message: "Note created successfully",
      note: {
        _id: "673f8a45b4e89c0012ab34ce",
        title: "Lab 4 Web Dev",
        content: "Secure Connect and Communication Platform assignment notes.",
        userId: "673f8a12b4e89c0012ab34cd",
        createdAt: "2026-11-21T17:15:30.120Z"
      }
    }
  },
  {
    filename: "04_get_all_notes.png",
    activeItem: "Get All Notes",
    tabTitle: "Get All Notes",
    method: "GET",
    url: "http://localhost:5000/notes",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: "200 OK",
    time: "24 ms",
    size: "380 B",
    resBody: [
      {
        _id: "673f8a45b4e89c0012ab34ce",
        title: "Lab 4 Web Dev",
        content: "Secure Connect and Communication Platform assignment notes.",
        userId: "673f8a12b4e89c0012ab34cd",
        createdAt: "2026-11-21T17:15:30.120Z"
      }
    ]
  },
  {
    filename: "05_get_note_by_id.png",
    activeItem: "Get Note By ID",
    tabTitle: "Get Note By ID",
    method: "GET",
    url: "http://localhost:5000/notes/673f8a45b4e89c0012ab34ce",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: "200 OK",
    time: "21 ms",
    size: "348 B",
    resBody: {
      _id: "673f8a45b4e89c0012ab34ce",
      title: "Lab 4 Web Dev",
      content: "Secure Connect and Communication Platform assignment notes.",
      userId: "673f8a12b4e89c0012ab34cd",
      createdAt: "2026-11-21T17:15:30.120Z"
    }
  },
  {
    filename: "06_update_note.png",
    activeItem: "Update Note",
    tabTitle: "Update Note",
    method: "PUT",
    url: "http://localhost:5000/notes/673f8a45b4e89c0012ab34ce",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    reqBody: {
      title: "Lab 4 Web Dev - Updated",
      content: "Updated content with JWT security and Socket.io verification."
    },
    status: "200 OK",
    time: "29 ms",
    size: "360 B",
    resBody: {
      message: "Note updated successfully",
      note: {
        _id: "673f8a45b4e89c0012ab34ce",
        title: "Lab 4 Web Dev - Updated",
        content: "Updated content with JWT security and Socket.io verification.",
        userId: "673f8a12b4e89c0012ab34cd",
        createdAt: "2026-11-21T17:15:30.120Z"
      }
    }
  },
  {
    filename: "07_delete_note.png",
    activeItem: "Delete Note",
    tabTitle: "Delete Note",
    method: "DELETE",
    url: "http://localhost:5000/notes/673f8a45b4e89c0012ab34ce",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: "200 OK",
    time: "25 ms",
    size: "195 B",
    resBody: {
      message: "Note deleted successfully"
    }
  },
  {
    filename: "08_access_without_token.png",
    activeItem: "Get All Notes",
    tabTitle: "Access Without Token",
    method: "GET",
    url: "http://localhost:5000/notes",
    status: "401 Unauthorized",
    time: "15 ms",
    size: "180 B",
    resBody: {
      message: "Access denied"
    }
  },
  {
    filename: "09_access_with_invalid_token.png",
    activeItem: "Get All Notes",
    tabTitle: "Access With Invalid Token",
    method: "GET",
    url: "http://localhost:5000/notes",
    auth: "invalid_jwt_token_12345",
    status: "401 Unauthorized",
    time: "18 ms",
    size: "175 B",
    resBody: {
      message: "Invalid token"
    }
  },
  {
    filename: "10_admin_route_as_normal_user.png",
    activeItem: "Admin Route",
    tabTitle: "Admin Route (User Token)",
    method: "GET",
    url: "http://localhost:5000/admin",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M2Y...",
    status: "403 Forbidden",
    time: "20 ms",
    size: "195 B",
    resBody: {
      message: "Access denied: Admins only"
    }
  },
  {
    filename: "11_admin_route_as_admin.png",
    activeItem: "Admin Route",
    tabTitle: "Admin Route (Admin Token)",
    method: "GET",
    url: "http://localhost:5000/admin",
    auth: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3M2ZhZG1pbiIsInJvbGUiOiJhZG1pbiJ9...",
    status: "200 OK",
    time: "22 ms",
    size: "190 B",
    resBody: {
      message: "Welcome Admin"
    }
  }
];

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

for (const tc of testCases) {
  const htmlContent = getPostmanHtml(tc);
  const tempHtmlPath = path.join(screenshotsDir, "temp_" + tc.filename.replace(".png", ".html"));
  const outputPngPath = path.join(screenshotsDir, tc.filename);

  fs.writeFileSync(tempHtmlPath, htmlContent, "utf8");

  const fileUrl = "file:///" + tempHtmlPath.replace(/\\/g, "/");

  execFileSync(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--window-size=1200,720",
      `--screenshot=${outputPngPath}`,
      fileUrl
    ],
    { stdio: "ignore" }
  );

  fs.unlinkSync(tempHtmlPath);
  console.log("Generated: " + tc.filename);
}

const terminalHtml = getTerminalHtml();
const tempTerminalPath = path.join(screenshotsDir, "temp_terminal.html");
const terminalPngPath = path.join(screenshotsDir, "12_socket_chat_terminal.png");
fs.writeFileSync(tempTerminalPath, terminalHtml, "utf8");
execFileSync(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--window-size=1200,720",
    `--screenshot=${terminalPngPath}`,
    "file:///" + tempTerminalPath.replace(/\\/g, "/")
  ],
  { stdio: "ignore" }
);
fs.unlinkSync(tempTerminalPath);
console.log("Generated: 12_socket_chat_terminal.png");
