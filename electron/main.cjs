const { app, BrowserWindow, dialog } = require("electron");
const { fork } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");

const PORT = 3000;
let serverProcess;

function loadUserEnvironment() {
  const envFile = path.join(app.getPath("userData"), ".env");
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !match[1].startsWith("#")) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function waitForServer() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 30_000;
    const probe = () => {
      const socket = net.connect(PORT, "127.0.0.1");
      socket.once("connect", () => { socket.destroy(); resolve(); });
      socket.once("error", () => { socket.destroy(); Date.now() > deadline ? reject(new Error("StudioFlow could not start its local server.")) : setTimeout(probe, 250); });
    };
    probe();
  });
}

async function startServer() {
  loadUserEnvironment();
  const serverPath = app.isPackaged ? path.join(process.resourcesPath, "app", ".next", "standalone", "server.js") : path.join(app.getAppPath(), ".next", "standalone", "server.js");
  serverProcess = fork(serverPath, [], { env: { ...process.env, PORT: String(PORT), HOSTNAME: "127.0.0.1", NEXTAUTH_URL: process.env.NEXTAUTH_URL || `http://localhost:${PORT}`, ELECTRON_RUN_AS_NODE: "1" }, execPath: process.execPath, stdio: "ignore" });
  await waitForServer();
}

function createWindow() {
  const window = new BrowserWindow({ width: 1440, height: 960, minWidth: 980, minHeight: 700, autoHideMenuBar: true, backgroundColor: "#0d0f16", webPreferences: { contextIsolation: true, nodeIntegration: false } });
  window.loadURL(`http://127.0.0.1:${PORT}`);
}

app.whenReady().then(async () => { try { await startServer(); createWindow(); } catch (error) { dialog.showErrorBox("StudioFlow could not start", error.message); app.quit(); } });
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => { if (serverProcess) serverProcess.kill(); });
