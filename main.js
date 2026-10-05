const { app, BrowserWindow, ipcMain, Menu, screen } = require("electron");
const path = require("path");
const fs = require("fs");
let win;
const DEBUG = process.argv.includes("--dev");
if (!app.requestSingleInstanceLock()) app.quit();

function create() {
  const { workArea: a } = screen.getPrimaryDisplay();
  const W = 300, H = 560;
  win = new BrowserWindow({
    width: W, height: H, x: DEBUG ? a.x + 60 : a.x + a.width - W - 20, y: DEBUG ? a.y + 20 : a.y + a.height - H,
    transparent: !DEBUG, frame: DEBUG, resizable: DEBUG, hasShadow: false, backgroundColor: DEBUG ? "#334155" : "#00000000",
    alwaysOnTop: true, skipTaskbar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.webContents.on("console-message", (e, level, message) => console.log("[page]", e.message ?? message, e.sourceId || ""));
  win.webContents.on("preload-error", (_e, f, err) => console.log("[preload error]", f, err));
  win.webContents.on("did-fail-load", (_e, code, desc) => console.log("[load failed]", code, desc));
  win.webContents.on("render-process-gone", (_e, d) => console.log("[renderer crashed]", d.reason));
  win.webContents.once("did-finish-load", () => console.log("[main] page loaded. window:", JSON.stringify(win.getBounds()), "screen:", JSON.stringify(a)));
  win.loadFile("index.html");
  if (DEBUG) win.webContents.openDevTools({ mode: "detach" });
}
ipcMain.handle("model", () => { const p = path.join(__dirname, "character.glb"); const ok = fs.existsSync(p); console.log("[main] character.glb:", ok ? "found, " + fs.statSync(p).size + " bytes" : "NOT FOUND at " + p); return ok ? fs.readFileSync(p) : null; });
ipcMain.on("move", (_e, dx, dy) => { if (!win) return; const [x, y] = win.getPosition(); win.setPosition(Math.round(x + dx), Math.round(y + dy)); });
// Lets clicks pass through the transparent parts of the window (not supported on Linux).
ipcMain.on("ignore", (_e, flag) => { if (win && process.platform !== "linux") win.setIgnoreMouseEvents(flag, { forward: true }); });
ipcMain.on("menu", () => {
  Menu.buildFromTemplate([
    { label: "Start at login", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin, click: i => app.setLoginItemSettings({ openAtLogin: i.checked }) },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]).popup({ window: win });
});
app.whenReady().then(() => {
  create();
  if (app.isPackaged) {
    const { autoUpdater } = require("electron-updater");
    const check = () => autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    check(); setInterval(check, 6 * 3600 * 1000);
  }
});
app.on("window-all-closed", () => app.quit());
